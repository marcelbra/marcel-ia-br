import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import AcademicsSection from "./AcademicsSection";

const realRect = Element.prototype.getBoundingClientRect;

afterEach(() => {
  vi.unstubAllGlobals();
  Element.prototype.getBoundingClientRect = realRect;
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 0 });
});

/**
 * Lay a page out with `room` pixels left for its bullets under `chrome` pixels
 * of logo, command line and heading, each bullet `item` tall. jsdom does no
 * layout of its own, and a list is never cut without one.
 */
const stubPages = (room: number, chrome: number, item: number) => {
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-fit-boundary") ? chrome + room : 0;
    },
  });
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const el = this as HTMLElement;
    const box = (top: number, height: number) =>
      ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
    if (el.tagName === "UL") return box(0, room);
    if (el.tagName === "LI") {
      const index = [...(el.parentElement?.children ?? [])].indexOf(el);
      return box(index * item, item);
    }
    // Everything the page holds, which is the same before and after a cut.
    if (el.parentElement?.hasAttribute("data-fit-boundary")) return box(0, chrome + room);
    return box(0, 0);
  };
};

describe("the stack of pages", () => {
  it("keeps each page inside its own box, so the next one cannot bleed in", () => {
    const { container } = render(<AcademicsSection />);
    const pages = [...container.firstElementChild!.children];

    expect(pages).toHaveLength(4);
    // A page clips to its own height, so the page below cannot bleed into it.
    // What a card has no room for is handed to its pager rather than to this.
    expect(pages.every((page) => page.className.includes("overflow-hidden"))).toBe(true);
  });

  it("pages the bullets a window has no room for, the way a CV role does", () => {
    // 40px left for the bullets, 20px to each: two of the three on this degree.
    stubPages(40, 100, 20);
    const { container } = render(<AcademicsSection />);

    // The TU Munich page: three bullets, and a window with room for two.
    const list = container.querySelectorAll("ul")[1];
    const hidden = () => [...list.children].map((item) => item.className.includes("invisible"));
    expect(hidden()).toEqual([false, false, true]);
    // The list is cut to the room rather than to its own content, so the card
    // around it holds still as the pages turn.
    expect(list.style.height).toBe("40px");

    // The pager turns to what is left, and starts where this page ran out.
    const [back] = screen.getAllByRole("button", { name: "Previous bullets" });
    const [on] = screen.getAllByRole("button", { name: "Next bullets" });
    expect(back).toBeDisabled();

    fireEvent.click(on);
    expect(hidden()).toEqual([true, true, false]);
    expect(on).toBeDisabled();
    expect(back).toBeEnabled();

    fireEvent.click(back);
    expect(hidden()).toEqual([false, false, true]);
  });

  it("leaves a degree that fits without a pager at all", () => {
    // Room for every bullet on every page: nothing to turn to.
    stubPages(200, 100, 20);
    render(<AcademicsSection />);

    expect(screen.queryByRole("button", { name: "Next bullets" })).not.toBeInTheDocument();
  });

  it("turns its pages: a flick moves the stack to the next one", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
    const { container } = render(<AcademicsSection />);
    const stack = container.firstElementChild as HTMLElement;
    // jsdom has no layout, so the pages are given the heights they would have.
    [...stack.children].forEach((page, i) =>
      Object.defineProperty(page, "offsetTop", { value: i * 100, configurable: true }),
    );

    act(() => void stack.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, cancelable: true })));
    act(() => void vi.advanceTimersByTime(200));

    expect(stack.scrollTop).toBe(100);
    vi.useRealTimers();
  });
});

describe("the logo above each card", () => {
  it("stands on its own, so no wordmark shows up beside it on a phone", () => {
    const { container } = render(<AcademicsSection />);
    const rows = [...container.querySelectorAll("img")].map((img) => img.parentElement!);

    expect(rows).toHaveLength(4);
    // The institution used to be spelled out next to the logo and hidden from
    // md up — which left "Goethe University Frankfurt" printed beside the very
    // logo that says it, on exactly the narrow screens that have no room.
    expect(rows.every((row) => row.textContent === "")).toBe(true);
  });
});

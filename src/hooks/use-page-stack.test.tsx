import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { usePageStack } from "./use-page-stack";

const PAGE_H = 100;
const PAGES = 4;

const Stack = () => {
  const ref = usePageStack<HTMLDivElement>(PAGES);
  return (
    <div ref={ref} data-testid="stack">
      {Array.from({ length: PAGES }, (_, i) => <div key={i}>page {i}</div>)}
    </div>
  );
};

// jsdom has no layout, so the pages are given the heights they would have.
const mount = () => {
  const { getByTestId } = render(<Stack />);
  const stack = getByTestId("stack") as HTMLDivElement;
  [...stack.children].forEach((page, i) =>
    Object.defineProperty(page, "offsetTop", { value: i * PAGE_H, configurable: true }),
  );
  return stack;
};

const flick = (stack: HTMLElement, deltaY: number) =>
  act(() => void stack.dispatchEvent(new WheelEvent("wheel", { deltaY, cancelable: true })));

const swipe = (stack: HTMLElement, distance: number) =>
  act(() => {
    const start = new Event("touchstart") as Event & { touches: { clientY: number }[] };
    start.touches = [{ clientY: 400 }];
    stack.dispatchEvent(start);
    const end = new Event("touchend") as Event & { changedTouches: { clientY: number }[] };
    end.changedTouches = [{ clientY: 400 - distance }];
    stack.dispatchEvent(end);
  });

const settle = (ms = 300) => act(() => void vi.advanceTimersByTime(ms));

describe("turning the pages of a stack", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] }));
  afterEach(() => vi.useRealTimers());

  it("turns one page per flick", () => {
    const stack = mount();

    flick(stack, 120);
    settle(320);
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("turns a page per notch of a spin, without waiting for each to land", () => {
    const stack = mount();

    // Three notches inside the time one page takes to travel: a reader who
    // spins the wheel wants to get somewhere, and the pages follow at the
    // same unhurried speed rather than queueing behind one another.
    flick(stack, 120);
    settle(160);
    flick(stack, 120);
    settle(160);
    flick(stack, 120);
    settle(400);
    expect(stack.scrollTop).toBe(PAGE_H * 3);
  });

  it("counts one notch, not the burst a single detent can arrive as", () => {
    const stack = mount();

    flick(stack, 120);
    settle(40);
    flick(stack, 120);
    settle(400);
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("takes the second of two quick swipes instead of swallowing it", () => {
    const stack = mount();

    swipe(stack, 80);
    // A hand on the page keeps up with the hand: the reader who swipes twice
    // means two pages, not one page and a wait.
    settle(150);
    swipe(stack, 80);
    settle(200);
    expect(stack.scrollTop).toBe(PAGE_H * 2);
  });

  it("reads a trackpad's decaying tail as the one flick it came from", () => {
    const stack = mount();

    // A flick and the momentum the trackpad keeps sending after the fingers
    // have gone: one push, and it must not carry the reader through the stack.
    for (const delta of [120, 96, 74, 55, 40, 28, 18, 11, 6]) {
      flick(stack, delta);
      settle(16);
    }
    settle(500);
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("stops at the ends of the stack", () => {
    const stack = mount();

    flick(stack, -120);
    settle(500);
    expect(stack.scrollTop).toBe(0);

    for (let i = 0; i < PAGES + 2; i++) {
      flick(stack, 120);
      settle(500);
    }
    expect(stack.scrollTop).toBe(PAGE_H * (PAGES - 1));
  });

  it("puts the current page back on its mark when the window resizes", () => {
    const observed: Array<{ notify: () => void; el: Element }> = [];
    vi.stubGlobal("ResizeObserver", class {
      constructor(private notify: () => void) {}
      observe(el: Element) { observed.push({ notify: this.notify, el }); }
      disconnect() {}
    });
    const stack = mount();
    flick(stack, 120);
    settle(320);

    // A resize leaves the stack scrolled to the old page height; the current
    // page has to be put back on its mark or the next one shows through.
    stack.scrollTop = 37;
    act(() => void observed.find((o) => o.el === stack)!.notify());
    expect(stack.scrollTop).toBe(PAGE_H);
    vi.unstubAllGlobals();
  });
});

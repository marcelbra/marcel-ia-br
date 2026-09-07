import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import AcademicsSection from "./AcademicsSection";

afterEach(() => {
  vi.unstubAllGlobals();
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});

describe("the stack of pages", () => {
  it("keeps each page inside its own box, so the next one cannot bleed in", () => {
    const { container } = render(<AcademicsSection />);
    const pages = [...container.firstElementChild!.children];

    expect(pages).toHaveLength(4);
    // A page clips to its own height: a card too tall for a short window is cut
    // off at the fold instead of spilling onto the page below.
    expect(pages.every((page) => page.className.includes("overflow-hidden"))).toBe(true);
  });

  it("snaps back to the current page when the window is resized", () => {
    const observed: Array<{ notify: () => void; el: Element }> = [];
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private notify: () => void) {}
        observe(el: Element) {
          observed.push({ notify: this.notify, el });
        }
        disconnect() {}
      },
    );

    const { container } = render(<AcademicsSection />);
    const stack = container.firstElementChild!;
    const watcher = observed.find((o) => o.el === stack);
    expect(watcher).toBeDefined();

    // A resize leaves the stack scrolled to the old page height; the current
    // page has to be put back on its mark or the next one shows through.
    watcher!.notify();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
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

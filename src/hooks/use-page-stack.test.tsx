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

const flick = (stack: HTMLElement, deltaY: number, deltaMode = 0) =>
  act(() => void stack.dispatchEvent(new WheelEvent("wheel", { deltaY, deltaMode, cancelable: true })));

const swipe = (stack: HTMLElement, distance: number) =>
  act(() => {
    const start = new Event("touchstart") as Event & { touches: { clientY: number }[] };
    start.touches = [{ clientY: 400 }];
    stack.dispatchEvent(start);
    const end = new Event("touchend") as Event & { changedTouches: { clientY: number }[] };
    end.changedTouches = [{ clientY: 400 - distance }];
    stack.dispatchEvent(end);
  });

/** Long enough for the stack to have caught its mark and stopped. */
const settle = (ms = 700) => act(() => void vi.advanceTimersByTime(ms));

describe("turning the pages of a stack", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] }));
  afterEach(() => vi.useRealTimers());

  it("turns one page per notch", () => {
    const stack = mount();

    flick(stack, 120);
    settle();
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
    settle();
    expect(stack.scrollTop).toBe(PAGE_H * 3);
  });

  it("turns straight back round when the reader does", () => {
    const stack = mount();

    flick(stack, 120);
    settle(160);
    flick(stack, 120);
    settle();
    expect(stack.scrollTop).toBe(PAGE_H * 2);

    // Nobody turns back inside one push, so the other way round is a new
    // gesture: it waits for nothing, and it is not the tail of the last one.
    settle(40);
    flick(stack, -120);
    settle();
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("counts how far the wheel was pushed, not how many events it sent", () => {
    const stack = mount();

    // A trackpad sends a stream of small deltas where a mouse sends one fat
    // notch; the same push has to mean the same thing on both.
    for (let i = 0; i < 3; i++) {
      flick(stack, 25);
      settle(20);
    }
    settle();
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("reads a wheel that counts in lines rather than pixels", () => {
    const stack = mount();

    // Firefox reports lines. Taken at face value the delta is a rounding
    // error and the page never turns.
    flick(stack, 4, 1);
    settle();
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  // What one flick of a MacBook's trackpad actually sends: the fingers, whose
  // delta climbs as they move, and then the momentum that opens with an
  // impulse of its own — higher than anything the fingers sent — and decays
  // from there. Every 8ms, the way the display asks for frames.
  const FLICK_FINGERS = [2, 5, 11, 21, 34, 49, 61, 68, 64, 57];
  // The decay is not a clean slope: it holds a value for a frame or two on the
  // way down, which is what a tail that only watches for "smaller than the
  // last one" reads as a fresh push.
  const FLICK_MOMENTUM = [92, 88, 88, 80, 74, 74, 66, 60, 60, 54, 48, 48, 42, 38, 38, 32, 28, 28, 24, 20, 20, 16, 12, 12, 8, 6, 6, 4, 2, 2, 1];
  const trackpadFlick = (stack: HTMLElement, direction = 1) => {
    for (const delta of [...FLICK_FINGERS, ...FLICK_MOMENTUM]) {
      flick(stack, delta * direction);
      settle(8);
    }
  };

  it("turns one page for one flick of a trackpad, momentum and all", () => {
    const stack = mount();

    trackpadFlick(stack);
    settle();
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("turns the next page for the next flick, tail or no tail", () => {
    const stack = mount();

    trackpadFlick(stack);
    // A second flick lands while the first is still coasting: the hand
    // pushing back through the tail is what tells the two apart.
    settle(400);
    trackpadFlick(stack);
    settle();
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
    settle();
    expect(stack.scrollTop).toBe(PAGE_H);
  });

  it("takes the second of two quick swipes instead of swallowing it", () => {
    const stack = mount();

    swipe(stack, 80);
    // A hand on the page keeps up with the hand: the reader who swipes twice
    // means two pages, not one page and a wait.
    settle(150);
    swipe(stack, 80);
    settle();
    expect(stack.scrollTop).toBe(PAGE_H * 2);
  });

  it("turns a page for each notch of a wheel, which arrive on their own", () => {
    const stack = mount();

    // A wheel is silent between notches where a trackpad streams, and that
    // silence is all that separates a spin from one flick's momentum.
    for (let i = 0; i < 3; i++) {
      flick(stack, 100);
      settle(170);
    }
    settle();
    expect(stack.scrollTop).toBe(PAGE_H * 3);
  });

  it("stops at the ends of the stack", () => {
    const stack = mount();

    flick(stack, -120);
    settle();
    expect(stack.scrollTop).toBe(0);

    for (let i = 0; i < PAGES + 2; i++) {
      flick(stack, 120);
      settle();
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
    settle();

    // A resize leaves the stack scrolled to the old page height; the current
    // page has to be put back on its mark or the next one shows through.
    stack.scrollTop = 37;
    act(() => void observed.find((o) => o.el === stack)!.notify());
    expect(stack.scrollTop).toBe(PAGE_H);
    vi.unstubAllGlobals();
  });
});

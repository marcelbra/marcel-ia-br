import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { ComponentProps } from "react";
import TerminalWindow from "./TerminalWindow";

const VIEW_W = window.innerWidth;
const VIEW_H = window.innerHeight;
const HEADER_BOTTOM = 48;
const FOOTER_TOP = VIEW_H - 68;
const BASE = { left: 100, top: 120 };
// Taller than the window's own minimum height, so there is room to drag it
// smaller — a window already under that minimum is one the floor holds still.
const NATURAL = { w: 800, h: 560 };
/** The window's own MIN_H, mirrored: it is what every drag below stops at. */
const MIN_H = 460;
/** A shrink that stays clear of that floor, so the drag is the whole story. */
const SHRUNK_BY = 80;

/** Stubs a rect on an element that jsdom would otherwise report as all zeroes. */
const fixedRect = (el: HTMLElement, r: { left: number; top: number; right: number; bottom: number }) => {
  el.getBoundingClientRect = () => ({ ...r, width: r.right - r.left, height: r.bottom - r.top, x: r.left, y: r.top, toJSON: () => ({}) }) as DOMRect;
};

/**
 * jsdom does no layout, so give the window a believable one: it sits at BASE at
 * its natural size, shifted by whatever transform/width/height React just wrote.
 * It has to be in place before the first render, when the window already reads
 * its own geometry back, so it goes on the prototype rather than the node.
 */
const nativeRect = Element.prototype.getBoundingClientRect;
const layoutTerminal = function (this: Element) {
  const el = this as HTMLElement;
  // The slot the window sits in — it is where the window reads its origin from.
  if ((el.firstElementChild as HTMLElement | null)?.dataset?.testid === "terminal-window") {
    return { left: BASE.left, top: BASE.top, right: BASE.left + NATURAL.w, bottom: BASE.top + NATURAL.h, width: NATURAL.w, height: NATURAL.h, x: BASE.left, y: BASE.top, toJSON: () => ({}) } as DOMRect;
  }
  if (el.dataset?.testid !== "terminal-window") return nativeRect.call(this);
  const match = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform);
  const left = BASE.left + Number(match?.[1] ?? 0);
  const top = BASE.top + Number(match?.[2] ?? 0);
  const width = el.style.width ? parseFloat(el.style.width) : NATURAL.w;
  const height = el.style.height ? parseFloat(el.style.height) : NATURAL.h;
  return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
};

const setup = (props: Partial<ComponentProps<typeof TerminalWindow>> = {}) => {
  const header = document.createElement("header");
  const footer = document.createElement("footer");
  fixedRect(header, { left: 0, top: 0, right: VIEW_W, bottom: HEADER_BOTTOM });
  fixedRect(footer, { left: 0, top: FOOTER_TOP, right: VIEW_W, bottom: VIEW_H });
  document.body.append(header, footer);

  render(<TerminalWindow title="~/marcel" {...props}>body</TerminalWindow>);
  return screen.getByTestId("terminal-window");
};

const rect = (el: HTMLElement) => el.getBoundingClientRect();

/**
 * A press only becomes a drag once the pointer has cleared the drag threshold,
 * and the window starts following from there — so a real pointer always sends
 * that first move before the travel that is meant to move anything. SLOP is
 * added to both, which cancels out and leaves the asked-for travel.
 */
const SLOP = 8;

const press = (target: Element | Window, from: { x: number; y: number }) => {
  fireEvent.mouseDown(target, { clientX: from.x, clientY: from.y });
  fireEvent.mouseMove(window, { clientX: from.x + SLOP, clientY: from.y + SLOP });
};

const dragHandle = (win: HTMLElement, dir: string, to: { x: number; y: number }) => {
  const handle = win.querySelector(`[data-resize="${dir}"]`)!;
  const from = rect(win);
  press(handle, {
    x: dir.includes("w") ? from.left : dir.includes("e") ? from.right : from.left,
    y: dir.includes("n") ? from.top : dir.includes("s") ? from.bottom : from.top,
  });
  fireEvent.mouseMove(window, { clientX: to.x + SLOP, clientY: to.y + SLOP });
  fireEvent.mouseUp(window);
};

/** The title bar the body sits under, and how tall the body's content is. */
const TITLE_H = 32;
// Content that fits the window at its natural height and overflows it once the
// window is dragged in by SHRUNK_BY — which is what the scroll below is about.
const CONTENT_H = 480;

/**
 * jsdom gives every element a scroll box of zero, so the body gets a believable
 * one: it is what the window has left under the title bar, holding content of a
 * fixed height that stretches to fill the box when there is room to spare —
 * which is what `min-h-full` does to the sections in the real page.
 */
const layoutBody = (win: HTMLElement) => {
  const body = screen.getByTestId("terminal-body");
  let scrollTop = 0;
  Object.defineProperty(body, "clientHeight", { get: () => Math.max(0, rect(win).height - TITLE_H) });
  Object.defineProperty(body, "scrollHeight", { get: () => Math.max(CONTENT_H, body.clientHeight) });
  Object.defineProperty(body, "scrollTop", { get: () => scrollTop, set: (v: number) => { scrollTop = v; } });
  return body;
};

const dragTitleBy = (dx: number, dy: number) => {
  press(screen.getByText("~/marcel"), { x: 400, y: 200 });
  fireEvent.mouseMove(window, { clientX: 400 + dx + SLOP, clientY: 200 + dy + SLOP });
  fireEvent.mouseUp(window);
};

describe("TerminalWindow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    Element.prototype.getBoundingClientRect = layoutTerminal;
  });
  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.getBoundingClientRect = nativeRect;
    document.querySelectorAll("header, footer").forEach((el) => el.remove());
  });

  it("double-clicking the title bar fills the space between header and footer, and again goes back", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");

    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM, right: VIEW_W, bottom: FOOTER_TOP });

    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: BASE.left, top: BASE.top, width: NATURAL.w, height: NATURAL.h });
  });

  it("resizing a filled window makes the next double-click fill it again", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");

    fireEvent.doubleClick(title);
    dragHandle(win, "se", { x: 700, y: 600 });
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM, right: 700, bottom: 600 });

    // We were not filled any more, so this fills rather than restores.
    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ right: VIEW_W, bottom: FOOTER_TOP });

    // And now the window remembers the size it was last given by hand.
    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM, right: 700, bottom: 600 });
  });

  it("keeps a scroll of its body to itself", () => {
    const win = setup();
    // jsdom does not scroll, so this guards the contract rather than the
    // behaviour: a drag that runs past the end of the terminal's content must
    // stop there instead of carrying on into the page behind it, which on a
    // phone drags the whole site around under your thumb.
    expect(screen.getByTestId("terminal-body")).toHaveClass("overflow-y-auto", "overscroll-contain");
    expect(win).toContainElement(screen.getByTestId("terminal-body"));
  });

  it("keeps its rounded corners when it fills the space between header and footer", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");
    expect(win.className).toMatch(/\brounded-xl\b/);

    // Filling the width of the page is not the same as being the page: the
    // window keeps its own corners rather than squaring off against the chrome.
    fireEvent.doubleClick(title);
    expect(win.className).toMatch(/\brounded-xl\b/);
    expect(win.className).not.toMatch(/\brounded-none\b/);

    fireEvent.doubleClick(title);
    expect(win.className).toMatch(/\brounded-xl\b/);
  });

  it("measures its own box up front, so zooming has two lengths to animate between", () => {
    const win = setup();
    // A width of `auto` cannot be interpolated: without this the window would
    // snap to its zoomed width in one frame while the rest still animated.
    expect(win.style.width).toBe(`${NATURAL.w}px`);
    expect(win.style.height).toBe(`${NATURAL.h}px`);

    // And the zoom moves every edge in the same style change, under a transition.
    fireEvent.doubleClick(screen.getByText("~/marcel"));
    expect(win.className).toMatch(/transition-/);
    expect(win.style.width).toBe(`${VIEW_W}px`);
    expect(win.style.height).toBe(`${FOOTER_TOP - HEADER_BOTTOM}px`);
    expect(win.style.transform).toBe(`translate(${-BASE.left}px, ${HEADER_BOTTOM - BASE.top}px)`);
  });

  it("takes longer for a longer trip, the way AppKit times a window resize", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");

    // 0.2s per 150px of the largest edge change: here the width moves furthest,
    // 800 -> 1024, so 224px at 1.333ms/px.
    fireEvent.doubleClick(title);
    expect(win.style.transitionDuration).toBe("299ms");

    // A window nudged just off the bounds has barely any distance to cover, and
    // must not sit through the same animation.
    dragHandle(win, "se", { x: VIEW_W - 40, y: FOOTER_TOP - 30 });
    fireEvent.doubleClick(title);
    const short = parseInt(win.style.transitionDuration, 10);
    expect(short).toBeLessThan(299);
    expect(short).toBeGreaterThanOrEqual(160);
  });

  it("stretches into the space fullscreen will take before handing over to it", () => {
    vi.useFakeTimers();
    const onFullscreen = vi.fn();
    const win = setup({ onFullscreen });

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));

    // The window is on its way and nothing has changed hands yet: swapping a
    // window for a full page in one frame reads as the page having jumped.
    expect(onFullscreen).not.toHaveBeenCalled();
    expect(win.className).toMatch(/transition-/);
    // The same 0.2s per 150px as the zoom, floored: the height has 92px to
    // travel here, 560 -> 652, which is under the 160ms floor.
    expect(win.style.transitionDuration).toBe("160ms");
    // Down the page, not across it — fullscreen keeps the same column, so a
    // stretch sideways would only have to snap back.
    expect(rect(win)).toMatchObject({
      left: BASE.left,
      top: HEADER_BOTTOM,
      width: NATURAL.w,
      height: FOOTER_TOP - HEADER_BOTTOM,
    });

    act(() => vi.advanceTimersByTime(160));
    expect(onFullscreen).toHaveBeenCalledTimes(1);
  });

  it("does not remember the stretch, so what comes back is the window that left", () => {
    vi.useFakeTimers();
    setup({ onFullscreen: vi.fn() });
    const geometry = [sessionStorage.getItem("terminal-offset"), sessionStorage.getItem("terminal-size")];
    expect(JSON.parse(geometry[1]!)).toMatchObject({ w: NATURAL.w, h: NATURAL.h });

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    act(() => vi.runAllTimers());

    // The page throws the window away on the way into fullscreen and mounts a
    // fresh one on the way out; it reads its geometry back from here.
    expect([sessionStorage.getItem("terminal-offset"), sessionStorage.getItem("terminal-size")]).toEqual(geometry);
  });

  it("shows its own fullscreen view only once the stretch is over, and hands the window back after", () => {
    vi.useFakeTimers();
    setup();

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    expect(screen.queryByLabelText("Exit fullscreen")).toBeNull();

    act(() => vi.runAllTimers());
    expect(screen.getByLabelText("Exit fullscreen")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Exit fullscreen"));
    expect(rect(screen.getByTestId("terminal-window"))).toMatchObject({
      left: BASE.left,
      top: BASE.top,
      width: NATURAL.w,
      height: NATURAL.h,
    });
  });

  it("leaves the button dead where the section has no fullscreen to go to", () => {
    vi.useFakeTimers();
    const onFullscreen = vi.fn();
    const win = setup({ onFullscreen, disableFullscreen: true });
    const before = rect(win);

    expect(screen.queryByLabelText("Enter fullscreen")).toBeNull();
    act(() => vi.runAllTimers());
    expect(onFullscreen).not.toHaveBeenCalled();
    expect(rect(win)).toMatchObject({ left: before.left, top: before.top, height: before.height });
  });

  it("resizes from every side, moving only the edge that was grabbed", () => {
    const win = setup();
    const { left, top, right, bottom } = rect(win);

    dragHandle(win, "e", { x: right - 150, y: 0 });
    expect(rect(win)).toMatchObject({ left, top, right: right - 150, bottom });

    dragHandle(win, "w", { x: left + 50, y: 0 });
    expect(rect(win)).toMatchObject({ left: left + 50, top, right: right - 150, bottom });

    dragHandle(win, "s", { x: 0, y: bottom - 50 });
    expect(rect(win)).toMatchObject({ left: left + 50, top, right: right - 150, bottom: bottom - 50 });

    dragHandle(win, "n", { x: 0, y: top + 30 });
    expect(rect(win)).toMatchObject({ left: left + 50, top: top + 30, right: right - 150, bottom: bottom - 50 });
  });

  it("resizes both axes at once from a corner and stops at the minimum size", () => {
    const win = setup();
    const { left, top } = rect(win);

    dragHandle(win, "se", { x: left + 40, y: top + 20 });
    expect(rect(win)).toMatchObject({ left, top, width: 320, height: MIN_H });
  });

  it("cannot be resized past the header or the footer", () => {
    const win = setup();

    dragHandle(win, "se", { x: VIEW_W + 400, y: VIEW_H + 400 });
    expect(rect(win)).toMatchObject({ right: VIEW_W, bottom: FOOTER_TOP });

    dragHandle(win, "nw", { x: -400, y: -400 });
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM });
  });

  it("does not move for the hand tremor of a double-click", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");
    const { left, top } = rect(win);

    // A press that drifts a couple of pixels is a click, not a drag. Without
    // this the window is tugged and the zoom then pulls it back — a wobble.
    fireEvent.mouseDown(title, { clientX: 400, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 403, clientY: 202 });
    fireEvent.mouseUp(window);
    expect(rect(win)).toMatchObject({ left, top });

    // Neither is the second press of a double-click, however far it drifts.
    fireEvent.mouseDown(title, { clientX: 400, clientY: 200, detail: 2 });
    fireEvent.mouseMove(window, { clientX: 440, clientY: 250 });
    fireEvent.mouseUp(window);
    expect(rect(win)).toMatchObject({ left, top });

    // A press that means it still moves the window.
    dragTitleBy(30, 20);
    expect(rect(win)).toMatchObject({ left: left + 30, top: top + 20 });
  });

  it("leaves the content at the top when the bottom edge is dragged in", () => {
    const win = setup();
    const body = layoutBody(win);
    const { bottom } = rect(win);

    // The top edge stays put, so the content stays under it and the resize
    // takes the tail off the bottom — nothing to scroll.
    dragHandle(win, "s", { x: 0, y: bottom - 200 });
    expect(body.scrollTop).toBe(0);
  });

  it("holds the content against the bottom when the top edge is dragged in", () => {
    const win = setup();
    const body = layoutBody(win);
    const { top } = rect(win);

    // The bottom edge is the one standing still now, so the content is scrolled
    // by everything the box lost: the last line stays in view and the cut lands
    // on the top instead.
    dragHandle(win, "n", { x: 0, y: top + SHRUNK_BY });
    expect(body.scrollTop).toBe(CONTENT_H - (NATURAL.h - SHRUNK_BY - TITLE_H));

    // And dragging the top edge back where it came from undoes exactly that.
    dragHandle(win, "n", { x: 0, y: top });
    expect(body.scrollTop).toBe(0);
  });

  it("holds the content against the bottom from a corner that carries the top edge", () => {
    const win = setup();
    const body = layoutBody(win);
    const { top, right } = rect(win);

    dragHandle(win, "ne", { x: right - 100, y: top + SHRUNK_BY });
    expect(body.scrollTop).toBe(CONTENT_H - (NATURAL.h - SHRUNK_BY - TITLE_H));
  });

  it("cannot be dragged past the header or the footer", () => {
    const win = setup();

    dragTitleBy(0, VIEW_H);
    expect(rect(win).bottom).toBe(FOOTER_TOP);

    dragTitleBy(0, -VIEW_H);
    expect(rect(win).top).toBe(HEADER_BOTTOM);

    dragTitleBy(VIEW_W, 0);
    expect(rect(win).right).toBe(VIEW_W);

    dragTitleBy(-VIEW_W, 0);
    expect(rect(win).left).toBe(0);
  });

  it("stays inside the bounds after being filled and shrunk, with no room left over", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");

    fireEvent.doubleClick(title);
    dragHandle(win, "se", { x: 700, y: 500 });

    // The one case that used to leak: a window that came from the filled state
    // could be dragged over the footer until it had been moved back inside once.
    dragTitleBy(0, VIEW_H);
    expect(rect(win).bottom).toBe(FOOTER_TOP);
  });

  it("restores the filled window across a remount", () => {
    const win = setup();
    fireEvent.doubleClick(screen.getByText("~/marcel"));
    expect(rect(win)).toMatchObject({ top: HEADER_BOTTOM, bottom: FOOTER_TOP });

    cleanup();
    document.querySelectorAll("header, footer").forEach((el) => el.remove());
    const again = setup();
    expect(rect(again)).toMatchObject({ left: 0, top: HEADER_BOTTOM, right: VIEW_W, bottom: FOOTER_TOP });
  });
});

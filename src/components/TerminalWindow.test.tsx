import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TerminalWindow from "./TerminalWindow";

const VIEW_W = window.innerWidth;
const VIEW_H = window.innerHeight;
const HEADER_BOTTOM = 48;
const FOOTER_TOP = VIEW_H - 68;
const BASE = { left: 100, top: 120 };
const NATURAL = { w: 800, h: 400 };

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
  if (el.dataset?.testid !== "terminal-window") return nativeRect.call(this);
  const match = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform);
  const left = BASE.left + Number(match?.[1] ?? 0);
  const top = BASE.top + Number(match?.[2] ?? 0);
  const width = el.style.width ? parseFloat(el.style.width) : NATURAL.w;
  const height = el.style.height ? parseFloat(el.style.height) : NATURAL.h;
  return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
};

const setup = () => {
  const header = document.createElement("header");
  const footer = document.createElement("footer");
  fixedRect(header, { left: 0, top: 0, right: VIEW_W, bottom: HEADER_BOTTOM });
  fixedRect(footer, { left: 0, top: FOOTER_TOP, right: VIEW_W, bottom: VIEW_H });
  document.body.append(header, footer);

  render(<TerminalWindow title="~/marcel">body</TerminalWindow>);
  return screen.getByTestId("terminal-window");
};

const rect = (el: HTMLElement) => el.getBoundingClientRect();

const dragHandle = (win: HTMLElement, dir: string, to: { x: number; y: number }) => {
  const handle = win.querySelector(`[data-resize="${dir}"]`)!;
  const from = rect(win);
  const grip = {
    x: dir.includes("w") ? from.left : dir.includes("e") ? from.right : from.left,
    y: dir.includes("n") ? from.top : dir.includes("s") ? from.bottom : from.top,
  };
  fireEvent.mouseDown(handle, { clientX: grip.x, clientY: grip.y });
  fireEvent.mouseMove(window, { clientX: to.x, clientY: to.y });
  fireEvent.mouseUp(window);
};

const dragTitleBy = (dx: number, dy: number) => {
  const title = screen.getByText("~/marcel");
  fireEvent.mouseDown(title, { clientX: 400, clientY: 200 });
  fireEvent.mouseMove(window, { clientX: 400 + dx, clientY: 200 + dy });
  fireEvent.mouseUp(window);
};

describe("TerminalWindow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    Element.prototype.getBoundingClientRect = layoutTerminal;
  });
  afterEach(() => {
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
    dragHandle(win, "se", { x: 700, y: 500 });
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM, right: 700, bottom: 500 });

    // We were not filled any more, so this fills rather than restores.
    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ right: VIEW_W, bottom: FOOTER_TOP });

    // And now the window remembers the size it was last given by hand.
    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM, right: 700, bottom: 500 });
  });

  it("resizes from every side, moving only the edge that was grabbed", () => {
    const win = setup();
    const { left, top, right, bottom } = rect(win);

    dragHandle(win, "e", { x: right - 150, y: 0 });
    expect(rect(win)).toMatchObject({ left, top, right: right - 150, bottom });

    dragHandle(win, "w", { x: left + 50, y: 0 });
    expect(rect(win)).toMatchObject({ left: left + 50, top, right: right - 150, bottom });

    dragHandle(win, "s", { x: 0, y: bottom - 80 });
    expect(rect(win)).toMatchObject({ left: left + 50, top, right: right - 150, bottom: bottom - 80 });

    dragHandle(win, "n", { x: 0, y: top + 40 });
    expect(rect(win)).toMatchObject({ left: left + 50, top: top + 40, right: right - 150, bottom: bottom - 80 });
  });

  it("resizes both axes at once from a corner and stops at the minimum size", () => {
    const win = setup();
    const { left, top } = rect(win);

    dragHandle(win, "se", { x: left + 40, y: top + 20 });
    expect(rect(win)).toMatchObject({ left, top, width: 320, height: 160 });
  });

  it("cannot be resized past the header or the footer", () => {
    const win = setup();

    dragHandle(win, "se", { x: VIEW_W + 400, y: VIEW_H + 400 });
    expect(rect(win)).toMatchObject({ right: VIEW_W, bottom: FOOTER_TOP });

    dragHandle(win, "nw", { x: -400, y: -400 });
    expect(rect(win)).toMatchObject({ left: 0, top: HEADER_BOTTOM });
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

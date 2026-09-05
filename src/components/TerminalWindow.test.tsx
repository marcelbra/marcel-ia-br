import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TerminalWindow from "./TerminalWindow";

const VIEW_W = window.innerWidth;
const VIEW_H = window.innerHeight;
const BASE = { left: 100, top: 120 };
const NATURAL = { w: 800, h: 400 };

/**
 * jsdom does no layout, so give the window a believable one: it sits at BASE at
 * its natural size, shifted by whatever transform/width/height React just wrote.
 */
const layout = (el: HTMLElement) => {
  el.getBoundingClientRect = () => {
    const match = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(el.style.transform);
    const left = BASE.left + Number(match?.[1] ?? 0);
    const top = BASE.top + Number(match?.[2] ?? 0);
    const width = el.style.width ? parseFloat(el.style.width) : NATURAL.w;
    const height = el.style.height ? parseFloat(el.style.height) : NATURAL.h;
    return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
  };
};

const setup = () => {
  render(<TerminalWindow title="~/marcel">body</TerminalWindow>);
  const win = screen.getByTestId("terminal-window");
  layout(win);
  return win;
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

describe("TerminalWindow", () => {
  beforeEach(() => sessionStorage.clear());

  it("double-clicking the title bar fills the viewport, and again goes back", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");

    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: 0, top: 0, width: VIEW_W, height: VIEW_H });

    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: BASE.left, top: BASE.top, width: NATURAL.w, height: NATURAL.h });
  });

  it("resizing a filled window makes the next double-click fill it again", () => {
    const win = setup();
    const title = screen.getByText("~/marcel");

    fireEvent.doubleClick(title);
    dragHandle(win, "se", { x: 700, y: 500 });
    expect(rect(win)).toMatchObject({ left: 0, top: 0, width: 700, height: 500 });

    // We were not full any more, so this fills rather than restores.
    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ width: VIEW_W, height: VIEW_H });

    // And now the window remembers the size it was last given by hand.
    fireEvent.doubleClick(title);
    expect(rect(win)).toMatchObject({ left: 0, top: 0, width: 700, height: 500 });
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

  it("keeps the window inside the viewport when resizing outwards", () => {
    const win = setup();

    dragHandle(win, "se", { x: VIEW_W + 400, y: VIEW_H + 400 });
    const r = rect(win);
    expect(r.right).toBe(VIEW_W);
    expect(r.bottom).toBe(VIEW_H);
  });

  it("restores the filled window across a remount", () => {
    const win = setup();
    fireEvent.doubleClick(screen.getByText("~/marcel"));
    expect(rect(win)).toMatchObject({ width: VIEW_W, height: VIEW_H });

    cleanup();
    const again = setup();
    expect(rect(again)).toMatchObject({ left: 0, top: 0, width: VIEW_W, height: VIEW_H });
  });
});

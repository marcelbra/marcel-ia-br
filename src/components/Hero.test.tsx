import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import Hero from "./Hero";

const FRAME_MS = 250;
const HOLD_MS = 5000;
const GREETING_MS = 3500;

const avatar = () => screen.getAllByAltText("Marcel Braasch pixel avatar")[0] as HTMLImageElement;

describe("Hero banner row", () => {
  it("reserves the avatar's height through the class that can give it back", () => {
    render(<Hero />);
    const row = avatar().closest(".hero-banner-row");

    // jsdom evaluates neither container nor pointer queries, so this guards
    // the wiring rather than the result: the row's height has to come from a
    // class those queries can reach (see .hero-banner-row in index.css), not
    // from a min-h-* utility, which sits in a later layer and would win over
    // them. The row holds the avatar's height so the wordmark can scale
    // underneath without shifting anything — except where the avatar is gone
    // and there is no window edge to drag, and the slot is 90px of nothing.
    expect(row).not.toBeNull();
    expect(row!.className).not.toMatch(/\bmin-h-/);
  });
});

describe("Hero avatar", () => {
  it("cannot be marked or dragged off the page, but is still there", () => {
    render(<Hero />);
    const img = avatar();

    // A drag across the hero used to pick the avatar up and mark it. It is out
    // of the selection now — which is not the same as being gone: the picture
    // still renders, and hovering it still wakes it.
    expect(img.closest(".hero-avatar")).toHaveClass("select-none");
    expect(img).toHaveAttribute("draggable", "false");
    expect(img.getAttribute("src")).toBeTruthy();
    // And it is never squeezed thinner to make room — it goes whole or not at all.
    expect(img.closest(".hero-avatar")).toHaveClass("shrink-0");
  });

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("plays to the last frame and shows the bubble without the pointer being held", () => {
    render(<Hero />);
    const first = avatar().src;

    fireEvent.mouseEnter(avatar());
    // Pointer leaves immediately — the cycle must carry on regardless.
    fireEvent.mouseLeave(avatar());

    act(() => void vi.advanceTimersByTime(FRAME_MS * 3));

    expect(screen.getByText("Hey there!")).toBeInTheDocument();
    expect(avatar().src).not.toBe(first);
  });

  it("holds the bubble for 5s, then rewinds to the first frame", () => {
    render(<Hero />);
    const first = avatar().src;

    fireEvent.mouseEnter(avatar());
    act(() => void vi.advanceTimersByTime(FRAME_MS * 3));
    expect(screen.getByText("Hey there!")).toBeInTheDocument();

    // Still held just before the 5s mark.
    act(() => void vi.advanceTimersByTime(HOLD_MS - 100));
    expect(screen.getByText("Hey there!")).toBeInTheDocument();

    // Past it, the bubble goes and the frames run back down.
    act(() => void vi.advanceTimersByTime(200));
    expect(screen.queryByText("Hey there!")).not.toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(FRAME_MS * 4));
    expect(avatar().src).toBe(first);
  });

  it("ignores re-entry while a cycle is already running", () => {
    render(<Hero />);
    fireEvent.mouseEnter(avatar());
    act(() => void vi.advanceTimersByTime(FRAME_MS * 3));
    const held = avatar().src;

    // A second hover mid-hold must not restart the sequence.
    fireEvent.mouseEnter(avatar());
    act(() => void vi.advanceTimersByTime(FRAME_MS));
    expect(avatar().src).toBe(held);
    expect(screen.getByText("Hey there!")).toBeInTheDocument();
  });
});

describe("the greeting nobody asked for", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("waves on its own a few seconds in, with no pointer anywhere near it", () => {
    render(<Hero />);

    act(() => void vi.advanceTimersByTime(GREETING_MS - 100));
    expect(screen.queryByText("Hey there!")).not.toBeInTheDocument();

    // The wave still takes its frames to play out before the bubble lands.
    act(() => void vi.advanceTimersByTime(100 + FRAME_MS * 3));
    expect(screen.getByText("Hey there!")).toBeInTheDocument();
  });

  it("puts the bubble on the avatar's left, where a phone can still see it", () => {
    render(<Hero />);
    act(() => void vi.advanceTimersByTime(GREETING_MS + FRAME_MS * 3));
    const bubble = screen.getByText("Hey there!");

    // The avatar ends the row, so anything hung off its right edge is past the
    // window's, and on a phone that is simply gone. The tail goes with it.
    expect(bubble).toHaveClass("right-full", "rounded-br-none");
    expect(bubble.className).not.toMatch(/(^|\s)-?right-\d/);
  });
});

/** The hero's parts, in a stubbed layout: jsdom does none of its own. */
const LINE = 10;
const BIO_LINES = 5;
const BANNER = 20;
/** The row with the avatar's slot open: 80px of it is the slot. */
const ROW = 100;
/** whoami, name, role, the links, and the margins between them. */
const CHROME = 60;

const realRect = Element.prototype.getBoundingClientRect;

const bioOf = () => [...document.querySelectorAll("p")].find((p) => p.textContent?.startsWith("bio"));
/** The column under the row — beside it once the window is flat. */
const bodyOf = () => bioOf()?.parentElement ?? null;
const rowOf = () => document.querySelector(".hero-banner-row") as HTMLElement | null;
const avatarShown = () => (document.querySelector(".hero-avatar") as HTMLElement | null)?.style.position !== "absolute";
const bioLinesShown = () => {
  const bio = bioOf();
  if (!bio) return 0;
  if (bio.style.height === "0px") return 0;
  return bio.style.webkitLineClamp ? Number(bio.style.webkitLineClamp) : BIO_LINES;
};

/**
 * Lay the hero out inside a boundary `room` pixels tall. Every part answers for
 * whatever the hero is currently showing of itself, so the fit is measured
 * against the same layout a browser would give it back.
 */
const stubHero = (room: number) => {
  const real = window.getComputedStyle.bind(window);
  vi.stubGlobal("getComputedStyle", (el: Element, pseudo?: string | null) => {
    const style = real(el, pseudo ?? undefined);
    return new Proxy(style, {
      get(target, key) {
        if (key === "lineHeight") return `${LINE}px`;
        const value = target[key as keyof CSSStyleDeclaration];
        return typeof value === "function" ? (value as () => unknown).bind(target) : value;
      },
    });
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute("data-fit-boundary") ? room : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return this === bioOf() ? BIO_LINES * LINE : 0;
    },
  });

  const rowHeight = () => (avatarShown() ? ROW : BANNER);
  const bodyHeight = () => CHROME + bioLinesShown() * LINE;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const el = this as HTMLElement;
    const box = (top: number, height: number) =>
      ({ top, height, bottom: top + height, left: 0, right: 0, width: 0, x: 0, y: top, toJSON: () => ({}) }) as DOMRect;
    if (el.tagName === "PRE") return box(0, BANNER);
    // The row sits above the body, which is what puts its height on the body's
    // bill — the layout the hero has anywhere but a flat window.
    if (el === rowOf()) return box(0, rowHeight());
    if (el === bodyOf()) return box(rowHeight(), bodyHeight());
    if (el === bioOf()) return box(rowHeight(), bioLinesShown() * LINE);
    // The hero's block and the section around it: what the boundary has to hold.
    if (el.classList.contains("hero-scope") || el.parentElement?.classList.contains("hero-scope")) {
      return box(0, rowHeight() + bodyHeight());
    }
    return box(0, 0);
  };
};

/**
 * The same layout, but with the row standing beside the body rather than over
 * it — what a flat window does with the hero. Nothing of the row's height is
 * height the body has to share there.
 */
const stubBeside = () => {
  const stacked = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const rect = stacked.call(this) as DOMRect;
    const el = this as HTMLElement;
    if (el === bodyOf() || el === bioOf()) {
      return { ...rect, top: 0, y: 0, bottom: rect.height, toJSON: () => ({}) } as DOMRect;
    }
    if (el.classList.contains("hero-scope") || el.parentElement?.classList.contains("hero-scope")) {
      const beside = Math.max(rowOf()!.getBoundingClientRect().height, bodyOf()!.getBoundingClientRect().height);
      return { ...rect, top: 0, y: 0, height: beside, bottom: beside, toJSON: () => ({}) } as DOMRect;
    }
    return rect;
  };
};

const renderInRoom = (room: number) => {
  stubHero(room);
  return render(
    <div data-fit-boundary>
      <Hero />
    </div>,
  );
};

describe("Hero in a terminal too short for it", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Element.prototype.getBoundingClientRect = realRect;
    for (const prop of ["clientHeight", "scrollHeight"]) {
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value: 0 });
    }
  });

  it("keeps all of itself where there is room for all of it", () => {
    renderInRoom(ROW + CHROME + BIO_LINES * LINE);

    expect(avatarShown()).toBe(true);
    expect(bioOf()!.getAttribute("style")).toBeNull();
    // The row's height is left to the class that reserves it, not overridden.
    expect(rowOf()!.style.minHeight).toBe("");
  });

  it("gives up the avatar before it gives up a word of the bio", () => {
    // One pixel short of the whole hero, which the avatar's slot covers 80 times
    // over: the bio must not pay for it.
    renderInRoom(ROW + CHROME + BIO_LINES * LINE - 1);

    expect(avatarShown()).toBe(false);
    expect(bioLinesShown()).toBe(BIO_LINES);
    // And the slot closes with it, rather than leaving 80px of nothing behind.
    expect(rowOf()!.style.minHeight).toBe("0px");
  });

  it("then gives up the bio a line at a time, so the links stay on the screen", () => {
    // 20px left for the bio once the avatar has gone: two of its five lines.
    renderInRoom(BANNER + CHROME + 2 * LINE);

    expect(avatarShown()).toBe(false);
    expect(bioOf()!.style.webkitLineClamp).toBe("2");
    // Clamped, not cut: the ellipsis says there is more of it to read.
    expect(bioOf()!.style.display).toBe("-webkit-box");
  });

  it("closes the bio rather than clamping it to a line that is not there", () => {
    renderInRoom(BANNER + CHROME);

    expect(bioLinesShown()).toBe(0);
    expect(bioOf()!.style.height).toBe("0px");
    // line-clamp counts from one, so a closed bio is closed by its height.
    expect(bioOf()!.style.webkitLineClamp).toBe("");
  });

  it("stops charging the row's height to the body once it stands beside it", () => {
    // Ten pixels short of the body's own height, so the bio gives up one line
    // of its five. Above the body the row would be costing 100 more, and the
    // bio would be down to two — the whole point of moving it.
    stubHero(CHROME + BIO_LINES * LINE - LINE);
    stubBeside();
    render(
      <div data-fit-boundary>
        <Hero />
      </div>,
    );

    expect(bioLinesShown()).toBe(BIO_LINES - 1);
  });

  it("keeps every part while there is no layout to measure", () => {
    // jsdom on its own: no heights, no line height, nothing to count against.
    render(
      <div data-fit-boundary>
        <Hero />
      </div>,
    );

    expect(avatarShown()).toBe(true);
    expect(bioOf()!.getAttribute("style")).toBeNull();
  });
});

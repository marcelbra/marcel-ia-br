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

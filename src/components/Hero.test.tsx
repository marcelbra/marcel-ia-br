import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import Hero from "./Hero";

const FRAME_MS = 250;
const HOLD_MS = 5000;

const avatar = () => screen.getAllByAltText("Marcel Braasch pixel avatar")[0] as HTMLImageElement;

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

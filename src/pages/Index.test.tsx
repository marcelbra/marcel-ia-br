import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "./Index";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );

const shell = (container: HTMLElement) => container.firstElementChild!;
const main = (container: HTMLElement) => within(container).getByRole("main");

/** The green traffic light, which expands the section it is showing. */
const expand = () => {
  const lights = screen.getByTestId("terminal-window").querySelectorAll(".group\\/btns > span");
  fireEvent.click(lights[2]);
};

describe("the page the terminal sits on", () => {
  beforeEach(() => sessionStorage.clear());

  it("is exactly as tall as the visible viewport, so it never scrolls", () => {
    const { container } = renderPage();

    // jsdom has no viewport to measure, so this guards the contract. h-viewport
    // is 100svh — the height with a phone's URL bar showing — where h-screen
    // would be 100vh, the taller height it has once that bar has scrolled away.
    // Sized in vh the page is taller than what you can see, so it has somewhere
    // to scroll to: the terminal's scroll drags the page along with it and the
    // URL bar collapses and expands the whole way. In svh the page always fits.
    expect(shell(container)).toHaveClass("h-viewport", "overflow-hidden");
    expect(shell(container)).not.toHaveClass("h-screen");
  });

  it("hands the scrolling to the terminal, which keeps it", () => {
    renderPage();
    expect(screen.getByTestId("terminal-body")).toHaveClass("overflow-y-auto", "overscroll-contain");
  });

  it("centres the terminal in the room it has, and clamps it to that room", () => {
    const { container } = renderPage();
    // min-h-0 is what makes the clamp real: without it the terminal would push
    // the page taller instead of being squeezed into what is left.
    expect(main(container)).toHaveClass("justify-center", "min-h-0");
  });

  it("starts an expanded section at the top of the page rather than centred", () => {
    const { container } = renderPage();
    expand();

    // Centred content that outgrows the page is cut off at both ends, and the
    // half above the top edge cannot be scrolled back to — you land in the
    // middle of a section with its beginning already gone. Expanded, the page
    // is a document: it begins at the top and runs down from there.
    expect(main(container)).not.toHaveClass("justify-center");
    // And it takes the height it needs, rather than being clamped and spilling.
    expect(main(container)).not.toHaveClass("min-h-0");
    expect(main(container).firstElementChild).not.toHaveClass("h-full");
  });

  it("expanded, fills the screen and then grows with what it holds", () => {
    const { container } = renderPage();
    expand();

    // A minimum of one screen and no more: a section that fits ends exactly at
    // the bottom edge with nothing to scroll, and a longer one scrolls because
    // it is genuinely longer. min-h-screen would be 100vh, which on a phone is
    // taller than the screen — enough to scroll, with nothing down there.
    expect(shell(container)).toHaveClass("min-h-viewport");
    expect(shell(container)).not.toHaveClass("min-h-screen", "overflow-hidden");
  });
});

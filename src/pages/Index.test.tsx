import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "./Index";

const renderPage = () =>
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );

describe("the page the terminal sits on", () => {
  beforeEach(() => sessionStorage.clear());

  it("is exactly as tall as the visible viewport, so it never scrolls", () => {
    const { container } = renderPage();
    const shell = container.firstElementChild!;

    // jsdom has no viewport to measure, so this guards the contract. h-viewport
    // is 100svh — the height with a phone's URL bar showing — where h-screen
    // would be 100vh, the taller height it has once that bar has scrolled away.
    // Sized in vh the page is taller than what you can see, so it has somewhere
    // to scroll to: the terminal's scroll drags the page along with it and the
    // URL bar collapses and expands the whole way. In svh the page always fits.
    expect(shell).toHaveClass("h-viewport", "overflow-hidden");
    expect(shell).not.toHaveClass("h-screen");
  });

  it("hands the scrolling to the terminal, which keeps it", () => {
    renderPage();
    expect(screen.getByTestId("terminal-body")).toHaveClass("overflow-y-auto", "overscroll-contain");
  });
});

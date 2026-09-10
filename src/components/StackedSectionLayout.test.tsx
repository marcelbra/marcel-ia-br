import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CvSection from "./CvSection";
import AcademicsSection from "./AcademicsSection";
import Index from "@/pages/Index";

// jsdom cannot measure layout. Guard the flex sizing contract here; verify
// actual centering and resize/page isolation in a real browser as well.
describe.each([
  ["CV", CvSection],
  ["academics", AcademicsSection],
] as const)("%s page alignment", (_name, Section) => {
  it("centers content in spare space", () => {
    const { container } = render(<Section />);
    for (const page of container.firstElementChild!.children) {
      const content = page.firstElementChild!;
      expect(page).toHaveClass("flex", "flex-col", "h-full", "overflow-hidden");
      // Auto margins share positive space, but become zero on overflow: unlike
      // justify-center, this never pushes the beginning above the page edge.
      expect(content).toHaveClass("m-auto", "w-full", "max-w-3xl");
    }
  });
});

describe.each([
  ["CV", CvSection],
  ["academics", AcademicsSection],
] as const)("a %s page in a window too short for it", (_name, Section) => {
  it("has the entry give way, so its card closes inside the window", () => {
    const { container } = render(<Section />);
    for (const page of container.firstElementChild!.children) {
      const content = page.firstElementChild!;
      // shrink-0 would hold the entry at its own height and let the page clip
      // it at the fold, which leaves the bullets past the edge unreadable —
      // there is no scrolling to reach them with. Giving way is what lets the
      // card close above the edge and hand the rest to the pager.
      expect(content).toHaveClass("min-h-0", "flex", "flex-col");
      expect(content).not.toHaveClass("shrink-0");
      // And the page is the box the bullets are counted against.
      expect(page).toHaveAttribute("data-fit-boundary");
    }
  });
});

// jsdom evaluates no media queries, so these guard the wiring rather than the
// result: verify what a flat window actually shows in a real browser.
describe("a flat window", () => {
  it("stands a role's intro beside its card rather than over it", () => {
    const { container } = render(<CvSection />);

    for (const page of container.firstElementChild!.children) {
      const [intro] = page.firstElementChild!.children;
      // A wordmark sets itself to whatever width it is given, so it survives a
      // column of its own — and the height it was costing goes to the card.
      expect(intro.className).toContain("flat-wide:w-[34%]");
      expect(page.firstElementChild!.className).toContain("flat-wide:flex-row");
    }
  });

  it("has a degree's intro go instead, having nowhere to stand", () => {
    const { container } = render(<AcademicsSection />);

    for (const page of container.firstElementChild!.children) {
      const [intro] = page.firstElementChild!.children;
      // A degree's logo is a picture blown up to nine times its box, sized for
      // a row as wide as the card. There is no column it fits in, so unlike a
      // wordmark it is not offered one.
      expect(intro.className).toContain("flat:hidden");
      expect(intro.className).not.toContain("flat-wide:");
    }
  });
});

// Marcel and writing live inside the terminal body rather than in a stack of
// pages, but a window pulled wider or zoomed open has to treat them the same:
// the content sits in the middle of the space it was given, not in its corner.
describe.each(["marcel", "writing"] as const)("the %s section", (name) => {
  // The terminal remembers its geometry across renders; each case starts fresh.
  beforeEach(() => sessionStorage.clear());

  it("centers its content in the terminal, the way the stacked pages do", () => {
    const { getByTestId, getByRole } = render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );
    if (name === "writing") fireEvent.click(getByRole("button", { name: /writing/i }));

    const content = getByTestId("terminal-body").querySelector("section > div")!;
    expect(content).toHaveClass("m-auto", "shrink-0", "w-full", "max-w-3xl");
  });

  it("keeps it centred when the window stretches out and fullscreen takes over", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );
    if (name === "writing") fireEvent.click(screen.getByRole("button", { name: /writing/i }));

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    act(() => vi.advanceTimersByTime(500));

    // The window has just finished growing into this exact column, with the
    // content centred in it. Anchoring it differently here would slide it
    // sideways at the very moment the view changes — the seam the stretch is
    // there to close.
    expect(document.querySelector("main section > div")).toHaveClass("mx-auto", "w-full", "max-w-3xl");
    vi.useRealTimers();
  });
});

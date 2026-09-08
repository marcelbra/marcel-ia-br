import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
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
});

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

describe("what a page does with a window too short for it", () => {
  it("keeps an academics entry at its own height and clips it at the fold", () => {
    const { container } = render(<AcademicsSection />);
    for (const page of container.firstElementChild!.children) {
      expect(page.firstElementChild!).toHaveClass("shrink-0");
    }
  });

  it("has a CV role give way instead, so its card closes inside the window", () => {
    const { container } = render(<CvSection />);
    for (const page of container.firstElementChild!.children) {
      const content = page.firstElementChild!;
      expect(content).toHaveClass("min-h-0", "flex", "flex-col");
      expect(content).not.toHaveClass("shrink-0");
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

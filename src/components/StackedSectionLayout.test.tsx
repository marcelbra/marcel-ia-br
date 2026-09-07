import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import CvSection from "./CvSection";
import AcademicsSection from "./AcademicsSection";

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

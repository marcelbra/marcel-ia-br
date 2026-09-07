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
  it("centers content in spare space without shrinking it in a short window", () => {
    const { container } = render(<Section />);
    for (const page of container.firstElementChild!.children) {
      const content = page.firstElementChild!;
      expect(page).toHaveClass("flex", "flex-col", "h-full", "overflow-hidden");
      // Auto margins share positive space, but become zero on overflow: unlike
      // justify-center, this never pushes the beginning above the page edge.
      expect(content).toHaveClass("m-auto", "shrink-0", "w-full", "max-w-3xl");
    }
  });
});

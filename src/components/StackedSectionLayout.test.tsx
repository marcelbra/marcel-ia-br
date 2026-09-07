import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CvSection from "./CvSection";
import AcademicsSection from "./AcademicsSection";
import Index from "@/pages/Index";

// jsdom cannot measure layout. Guard the flex sizing contract here; verify the
// actual anchoring and the resize/page isolation in a real browser as well.
const anchoredTopLeft = (content: Element) => {
  expect(content).toHaveClass("shrink-0", "w-full", "max-w-3xl");
  // No auto margin anywhere: spare space belongs after the content, so a window
  // pulled open grows away from it and the text stays where the eye left it.
  expect(content.className).not.toMatch(/\b(m|mx|my|mt|ml)-auto\b/);
};

describe.each([
  ["CV", CvSection],
  ["academics", AcademicsSection],
] as const)("%s page alignment", (_name, Section) => {
  it("holds content in the top-left corner of the page it sits on", () => {
    const { container } = render(<Section />);
    for (const page of container.firstElementChild!.children) {
      expect(page).toHaveClass("flex", "flex-col", "h-full", "overflow-hidden");
      anchoredTopLeft(page.firstElementChild!);
    }
  });
});

// Marcel and writing live inside the terminal body rather than in a stack of
// pages, but one window must not behave two ways: every section anchors the
// same, so zooming or dragging an edge never shifts the content around.
describe.each(["marcel", "writing"] as const)("the %s section", (name) => {
  // The terminal remembers its geometry across renders; each case starts fresh.
  beforeEach(() => sessionStorage.clear());

  it("holds its content in the terminal's top-left corner, as the pages do", () => {
    const { getByTestId, getByRole } = render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );
    if (name === "writing") fireEvent.click(getByRole("button", { name: /writing/i }));

    anchoredTopLeft(getByTestId("terminal-body").querySelector("section > div")!);
  });
});

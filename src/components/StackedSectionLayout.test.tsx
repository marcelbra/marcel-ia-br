import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CvSection from "./CvSection";
import AcademicsSection from "./AcademicsSection";
import Index from "@/pages/Index";

// jsdom cannot measure layout. Guard the flex sizing contract here; verify the
// actual anchoring and the resize/page isolation in a real browser as well.
const anchoredTopLeft = (content: Element) => {
  expect(content).toHaveClass("w-full", "max-w-3xl");
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

    const content = getByTestId("terminal-body").querySelector("section > div")!;
    expect(content).toHaveClass("shrink-0");
    anchoredTopLeft(content);
  });

  it("holds it there when the window stretches out and fullscreen takes over", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );
    if (name === "writing") fireEvent.click(screen.getByRole("button", { name: /writing/i }));

    fireEvent.click(screen.getByLabelText("Enter fullscreen"));
    act(() => vi.advanceTimersByTime(500));

    // The window has just finished growing into this exact column. Centring the
    // content here would slide it sideways at the very moment the view changes,
    // which is the seam the stretch is there to close.
    anchoredTopLeft(document.querySelector("main section > div")!);
    vi.useRealTimers();
  });
});

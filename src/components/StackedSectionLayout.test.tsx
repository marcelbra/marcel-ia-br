import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render } from "@testing-library/react";
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
});

// The window is nearly always bigger than one section's output, so the space
// under it is the normal case, not an edge case. A prompt at the end of the
// output is what makes that space read as a terminal waiting for the next
// command rather than as a page that stopped early.
describe("the space under a section's output", () => {
  it.each([
    ["CV", CvSection],
    ["academics", AcademicsSection],
  ] as const)("ends every %s page in a prompt", (_name, Section) => {
    const { container } = render(<Section />);
    for (const page of container.firstElementChild!.children) {
      expect(page.querySelectorAll('[data-testid="waiting-prompt"]')).toHaveLength(1);
    }
  });

  it.each([
    ["CV", CvSection],
    ["academics", AcademicsSection],
  ] as const)("keeps the %s prompt in the leftover space, never in the output", (_name, Section) => {
    const { container } = render(<Section />);
    for (const page of container.firstElementChild!.children) {
      const prompt = page.querySelector('[data-testid="waiting-prompt"]')!;
      // Its box is only what the output left over, so a window too short for
      // the output gives it nothing: it can neither push the card past the
      // fold nor cost the card a line of its own.
      expect(prompt.parentElement).toHaveClass("flex-1", "min-h-0", "overflow-hidden");
      expect(page.firstElementChild!.contains(prompt)).toBe(false);
    }
  });

  it.each(["marcel", "writing"] as const)("ends the %s section in a prompt", (name) => {
    sessionStorage.clear();
    const { getByTestId, getByRole } = render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );
    if (name === "writing") fireEvent.click(getByRole("button", { name: /writing/i }));

    expect(getByTestId("terminal-body").querySelectorAll('[data-testid="waiting-prompt"]')).toHaveLength(1);
  });
});

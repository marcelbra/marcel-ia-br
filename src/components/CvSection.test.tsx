import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CvSection from "./CvSection";
import { ASCII_DOTS } from "@/lib/clip";

const realRect = Element.prototype.getBoundingClientRect;

/** jsdom does no layout: pretend every box is `width` px on a `charWidth` grid. */
const stubLayout = (width: number, charWidth: number) => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: width });
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const w = charWidth * (this.textContent?.length ?? 0);
    return { x: 0, y: 0, top: 0, left: 0, right: w, bottom: 0, width: w, height: 0, toJSON: () => ({}) } as DOMRect;
  };
};

afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth;
});

describe("CvSection at a narrow width", () => {
  it("cuts bullet text with ascii dots instead of wrapping it onto a second line", () => {
    stubLayout(200, 5); // 40 characters fit
    const { container } = render(<CvSection />);

    const line = screen.getByTitle(/^Stack: Python \(Semantic Kernel/);
    expect(line.textContent).toHaveLength(40);
    expect(line.textContent?.endsWith("...")).toBe(true);
    // The full text stays available as the tooltip.
    expect(line.getAttribute("title")).toContain("ElevenLabs");
    expect(line.className).toContain("whitespace-nowrap");
    expect(container.querySelector(".flex-wrap")).toBeNull();
  });

  it("keeps every ascii wordmark on screen, cutting the wide ones down", () => {
    stubLayout(200, 5); // 40 characters fit
    const { container } = render(<CvSection />);

    const marks = [...container.querySelectorAll("pre")];
    expect(marks).toHaveLength(3);
    // No breakpoint may hide or swap out the wordmark.
    expect(marks.every((m) => !m.classList.contains("hidden") && !m.className.includes("md:"))).toBe(true);

    const [kpn, newtone] = marks;
    expect(kpn.textContent).not.toContain(ASCII_DOTS[1]); // 26 columns wide — it fits
    expect(newtone.textContent).toContain(ASCII_DOTS[1]); // 64 columns wide — it does not
    expect(newtone.textContent?.split("\n").every((l) => l.length <= 40)).toBe(true);
  });
});

describe("CvSection at a wide width", () => {
  it("shows the wordmarks and the bullets in full", () => {
    stubLayout(1000, 5); // 200 characters fit
    const { container } = render(<CvSection />);

    expect(screen.getByText(/Lead engineer building agent eval capabilities/)).toBeInTheDocument();
    expect([...container.querySelectorAll("pre")].every((m) => !m.textContent?.includes(ASCII_DOTS[1]))).toBe(true);
    expect(container.querySelector("[title]")).toBeNull(); // nothing was cut
  });
});

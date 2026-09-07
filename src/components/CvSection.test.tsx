import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CvSection from "./CvSection";

const realRect = Element.prototype.getBoundingClientRect;

const rect = (props: Partial<DOMRect>): DOMRect =>
  ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}), ...props }) as DOMRect;

interface Page {
  /** The height of one page of the stack, of what sits beside the bullet list
   *  on it, and of a single bullet. */
  height: number;
  chrome: number;
  itemHeight: number;
}

/** How many columns of art a wordmark holds, across all its letter blocks. */
const columnsOf = (mark: Element) =>
  [...mark.children].reduce((sum, letter) => sum + (letter.textContent?.split("\n")[0].length ?? 0), 0);

/** jsdom does no layout: pretend every box is `width` px on a `charWidth` grid. */
const stubLayout = (width: number, charWidth: number, page?: Page) => {
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: width });
  // A wordmark measures itself at the hook's reference size of 10px.
  Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.tagName === "PRE" ? columnsOf(this) * charWidth : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return page && this.hasAttribute("data-fit-boundary") ? page.height : 0;
    },
  });

  Element.prototype.getBoundingClientRect = function (this: Element) {
    // The list is squeezed into whatever the page has left over for it, and the
    // bullets keep their own places inside it however little that is.
    const room = page ? Math.max(0, page.height - page.chrome) : 0;
    if (page && this.tagName === "UL") return rect({ width, height: room, bottom: room });
    if (page && this.tagName === "LI") {
      const index = [...(this.parentElement?.children ?? [])].indexOf(this);
      const top = index * page.itemHeight;
      return rect({ width, top, height: page.itemHeight, bottom: top + page.itemHeight });
    }
    if (page && this.parentElement?.hasAttribute("data-fit-boundary")) {
      return rect({ width, height: page.chrome + room, bottom: page.chrome + room });
    }
    const w = charWidth * (this.textContent?.length ?? 0);
    return rect({ right: w, width: w });
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  Element.prototype.getBoundingClientRect = realRect;
  for (const box of ["clientWidth", "clientHeight", "scrollWidth"]) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[box];
  }
});

const lettersOf = (mark: Element) => [...mark.querySelectorAll<HTMLElement>("[data-letter]")];

/** The art rows, stitched back together out of the per-letter blocks. */
const rowsOf = (mark: Element) => {
  const blocks = lettersOf(mark).map((letter) => letter.textContent!.split("\n"));
  return blocks[0].map((_, row) => blocks.map((block) => block[row] ?? "").join(""));
};

const fontSizeOf = (mark: Element) => parseFloat((mark as HTMLElement).style.fontSize);

describe("CvSection at a narrow width", () => {
  it("wraps a bullet onto the next line instead of cutting it with dots", () => {
    stubLayout(200, 5); // 40 characters fit on a line
    const { container } = render(<CvSection />);

    // The tail of the longest bullet is text on the page, not a tooltip.
    expect(screen.getByText(/^Stack: Python \(Semantic Kernel.*ElevenLabs$/)).toBeInTheDocument();
    expect(container.querySelector(".whitespace-nowrap")).toBeNull();
    expect(container.querySelector("[title]")).toBeNull();
    expect(container.textContent).not.toContain("...");
  });

  it("wraps the role title too, rather than cutting the company off it", () => {
    stubLayout(200, 5);
    const { container } = render(<CvSection />);

    const [role] = container.querySelectorAll("h3");
    expect(role.textContent).toBe("Machine Learning Engineer @ Royal KPN N.V.");
    // The period sits beside the title while there is room and drops below it
    // when there is not — the same header as an academics entry.
    expect(role.parentElement!.className).toContain("flex-wrap");
  });

  it("sets the ascii wordmark smaller instead of dropping letters from it", () => {
    stubLayout(200, 5); // 40 characters fit at the reference size
    const { container } = render(<CvSection />);

    const marks = [...container.querySelectorAll("pre")];
    expect(marks).toHaveLength(3);
    // No breakpoint may hide or swap out the wordmark.
    expect(marks.every((m) => !m.classList.contains("hidden") && !m.className.includes("md:"))).toBe(true);
    // Every mark is still spelled out in full, however narrow the window is.
    expect(marks.map((m) => lettersOf(m).map((l) => l.dataset.letter).join(""))).toEqual([
      "KPN",
      "NEWTONE",
      "ERANEOS",
    ]);

    const [kpn, newtone] = marks;
    expect(fontSizeOf(kpn)).toBe(8); // 26 columns wide — it fits at full size
    expect(fontSizeOf(newtone)).toBeCloseTo(6.25); // 64 columns wide — it does not
  });

  it("never sets a wordmark wider than the box it sits in", () => {
    stubLayout(200, 5); // one character is half the font size wide
    const { container } = render(<CvSection />);

    for (const mark of container.querySelectorAll("pre")) {
      const columns = Math.max(...rowsOf(mark).map((row) => row.length));
      expect(columns * fontSizeOf(mark) * 0.5).toBeLessThanOrEqual(200);
    }
  });
});

describe("CvSection in a short window", () => {
  it("drops the bullets that no longer fit, whole ones at a time", () => {
    // 70px left for the list, 20px to a bullet: three of five fit.
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 });
    const { container } = render(<CvSection />);

    const [list] = container.querySelectorAll("ul");
    const items = [...list.children];
    expect(items).toHaveLength(5);
    expect(items.map((item) => item.className.includes("invisible"))).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
    // Dropped, not reflowed: what fits keeps its place, so the count is stable.
    expect(list.className).toContain("overflow-hidden");
  });

  it("ends the card under the last bullet it kept, not in dead space", () => {
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 });
    const { container } = render(<CvSection />);

    // Three bullets of 20px: the list is cut to them, so the border closes
    // right below the third rather than around the two that went.
    expect(container.querySelector("ul")!.style.height).toBe("60px");
  });

  it("says how many bullets it is holding back, and hands them over when asked", () => {
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 }); // three of five fit
    const { container } = render(<CvSection />);

    const [more] = screen.getAllByRole("button", { name: /\+2 more/ });
    fireEvent.click(more);

    // The role is on its own now, with no page above it to fit into and every
    // bullet in place...
    expect(container.querySelector("[data-fit-boundary]")).toBeNull();
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(1);
    expect([...lists[0].children].some((item) => item.className.includes("invisible"))).toBe(false);
    expect(lists[0].style.height).toBe("");

    // ...and a way back to the stack it came out of.
    fireEvent.click(screen.getByRole("button", { name: "← back" }));
    expect(container.querySelectorAll("ul")).toHaveLength(3);
  });

  it("says nothing about more while every bullet is showing", () => {
    stubLayout(1000, 5, { height: 300, chrome: 100, itemHeight: 20 });
    render(<CvSection />);

    expect(screen.queryByRole("button", { name: /more/ })).toBeNull();
  });

  it("keeps every bullet, and the card its natural height, while there is room", () => {
    stubLayout(1000, 5, { height: 300, chrome: 100, itemHeight: 20 });
    const { container } = render(<CvSection />);

    const [list] = container.querySelectorAll("ul");
    expect([...list.children].some((item) => item.className.includes("invisible"))).toBe(false);
    expect(list.style.height).toBe("");
  });

  it("lets the card give way so its border stays inside the window", () => {
    const { container } = render(<CvSection />);
    const [page] = container.firstElementChild!.children;
    const block = page.firstElementChild!;
    const card = block.lastElementChild!;

    // Bottom padding on the page is the gap the card keeps to the window edge;
    // the chain of min-h-0 is what makes the card yield that gap.
    expect(page.className).toContain("py-6");
    expect(block.className).toContain("min-h-0");
    expect(block.className).not.toContain("shrink-0");
    expect(card.className).toContain("min-h-0");
    expect(card.querySelector("ul")!.className).toContain("min-h-0");
  });
});

describe("how a role is sized", () => {
  it("scales with the terminal window rather than with a breakpoint", () => {
    const { container } = render(<CvSection />);

    for (const page of container.firstElementChild!.children) {
      expect(page.className).toContain("cv-scope");
    }
    expect(container.querySelector("h3")!.className).toContain("cv-role-title");
    expect(container.querySelector("li")!.className).toContain("cv-role-bullet");
    // Dragging the window's edge has to move the type as much as resizing the
    // browser does, so nothing here may hang off a viewport breakpoint.
    const sized = [...container.querySelectorAll("h3, li")];
    expect(sized.every((el) => !/\b(sm|md|lg|xl):/.test(el.className))).toBe(true);
  });
});

describe("CvSection ascii wordmarks", () => {
  it("splits every mark into one element per letter", () => {
    stubLayout(1000, 5);
    const { container } = render(<CvSection />);

    const words = [...container.querySelectorAll("pre")].map((mark) =>
      lettersOf(mark).map((letter) => letter.dataset.letter).join(""),
    );
    expect(words).toEqual(["KPN", "NEWTONE", "ERANEOS"]);
  });

  it("cuts the art on the real letter boundaries", () => {
    stubLayout(1000, 5);
    const { container } = render(<CvSection />);
    const seen = new Map<string, string>();

    for (const mark of container.querySelectorAll("pre")) {
      const rows = rowsOf(mark);
      // Every letter is a full-height block of equally long rows...
      expect(new Set(rows.map((row) => row.length)).size).toBe(1);

      for (const letter of lettersOf(mark)) {
        const block = letter.textContent!;
        expect(block.split("\n")).toHaveLength(rows.length);
        // ...and renders identically wherever that letter appears.
        const previous = seen.get(letter.dataset.letter!);
        if (previous !== undefined) expect(block).toBe(previous);
        seen.set(letter.dataset.letter!, block);
      }
    }

    expect(seen.get("K")).toBe(
      ["██╗  ██╗", "██║ ██╔╝", "█████╔╝ ", "██╔═██╗ ", "██║  ██╗", "╚═╝  ╚═╝"].join("\n"),
    );
  });

  it("leaves the pointer alone — the mark is not a link", () => {
    stubLayout(1000, 5);
    const { container } = render(<CvSection />);
    for (const mark of container.querySelectorAll("pre")) {
      expect(mark.className).not.toContain("cursor-pointer");
    }
  });
});

describe("CvSection at a wide width", () => {
  it("shows the wordmarks at full size and the bullets in full", () => {
    stubLayout(1000, 5); // 200 characters fit
    const { container } = render(<CvSection />);

    expect(screen.getByText(/Lead engineer building agent eval capabilities/)).toBeInTheDocument();
    expect([...container.querySelectorAll("pre")].every((m) => fontSizeOf(m) === 8)).toBe(true);
  });
});

describe("the stack of pages", () => {
  it("keeps each page inside its own box, so the next one cannot bleed in", () => {
    const { container } = render(<CvSection />);
    const pages = [...container.firstElementChild!.children];

    expect(pages).toHaveLength(3);
    // A page clips to its own height: a card too tall for a short window is cut
    // off at the fold instead of spilling onto the page below.
    expect(pages.every((page) => page.className.includes("overflow-hidden"))).toBe(true);
  });

  it("snaps back to the current page when the window is resized", () => {
    const observed: Array<{ notify: () => void; el: Element }> = [];
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private notify: () => void) {}
        observe(el: Element) {
          observed.push({ notify: this.notify, el });
        }
        disconnect() {}
      },
    );

    const { container } = render(<CvSection />);
    const stack = container.firstElementChild!;
    const watcher = observed.find((o) => o.el === stack);
    expect(watcher).toBeDefined();

    // A resize leaves the stack scrolled to the old page height; the current
    // page has to be put back on its mark or the next one shows through.
    watcher!.notify();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });
});

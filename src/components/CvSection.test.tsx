import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
    expect(role.textContent).toBe("Machine Learning Engineer@ Royal KPN N.V.");
    // The period sits beside the title while there is room and drops below it
    // when there is not — the same header as an academics entry.
    expect(role.parentElement!.className).toContain("flex-wrap");
  });

  it("comes apart a whole phrase at a time, the period first and the title last", () => {
    stubLayout(200, 5);
    const { container } = render(<CvSection />);

    // jsdom does no layout, so this guards the structure the cascade is made
    // of: two nested wrapping rows. The outer holds the title row and the
    // period, so the period is the first thing to drop; the inner holds the
    // title and the company, so the company drops next and takes its @ with
    // it. Flex wraps an item before it squeezes it, which leaves the title —
    // alone on a line by then, with nothing left to give up — as the only one
    // that ever breaks mid-phrase.
    const [role] = container.querySelectorAll("h3");
    const [title, company] = role.children;
    expect(role.className).toContain("flex-wrap");
    expect(title.textContent).toBe("Machine Learning Engineer");
    expect(company.textContent).toBe("@ Royal KPN N.V.");

    // And the period is the outer row's last item, beside the title row.
    const header = role.parentElement!;
    expect(header.children).toHaveLength(2);
    expect(header.lastElementChild!.textContent).toBe("Sep 2025 — Present");
    expect(header.lastElementChild!.className).toContain("shrink-0");
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

  it("gives a paged role the whole room, so the card holds still as pages turn", () => {
    // 70px left for the list, 20px to a bullet: three of five fit.
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 });
    const { container } = render(<CvSection />);
    const list = container.querySelector("ul")!;

    // The box is the room, not the 60px the three bullets on this page happen
    // to take. Sized to its own page, a last page holding fewer would pull the
    // card's bottom up — and its top down with it, the card being centred in
    // what it is given — so turning a page would move everything but the text.
    expect(list.style.height).toBe("70px");

    fireEvent.click(screen.getAllByRole("button", { name: "Next bullets" })[0]);
    expect(list.style.height).toBe("70px");
  });

  it("turns to the next page of bullets rather than sliding them up one", () => {
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 }); // three of five fit
    const { container } = render(<CvSection />);

    const shown = () =>
      [...container.querySelectorAll("ul")[0].children]
        .flatMap((item, j) => (item.className.includes("invisible") ? [] : [j]));
    const [back] = screen.getAllByRole("button", { name: "Previous bullets" });
    const [on] = screen.getAllByRole("button", { name: "Next bullets" });

    // Flush against the top of the role, so there is nothing to go back to.
    expect(shown()).toEqual([0, 1, 2]);
    expect(back).toBeDisabled();
    expect(on).toBeEnabled();

    // The next page begins where this one ran out — every bullet is read once,
    // in one place, rather than sliding up through the card a line at a time.
    fireEvent.click(on);
    expect(shown()).toEqual([3, 4]);
    expect(back).toBeEnabled();
    // Which is the whole role, so there is nothing left that way either.
    expect(on).toBeDisabled();

    // And back to the page it came from, not to some line in between.
    fireEvent.click(back);
    expect(shown()).toEqual([0, 1, 2]);
    expect(back).toBeDisabled();
  });

  it("keeps a bullet showing in a window with room for none", () => {
    // Five pixels of room, twenty to a bullet: nothing fits, and one shows.
    stubLayout(1000, 5, { height: 200, chrome: 195, itemHeight: 20 });
    const { container } = render(<CvSection />);

    const [list] = container.querySelectorAll("ul");
    expect([...list.children].filter((i) => !i.className.includes("invisible"))).toHaveLength(1);
    expect(list.style.height).toBe("20px");
  });

  it("turns pages sideways, by trackpad or by thumb", () => {
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 }); // three of five fit
    const { container } = render(<CvSection />);

    const list = container.querySelector("ul")!;
    const shown = () =>
      [...list.children].flatMap((item, j) => (item.className.includes("invisible") ? [] : [j]));
    const swipe = (dx: number, dy = 0) => {
      fireEvent.touchStart(list, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(list, { changedTouches: [{ clientX: 200 - dx, clientY: 100 - dy }] });
    };

    // A flick to the left goes on, the way it moves the page under your thumb.
    swipe(60);
    expect(shown()).toEqual([3, 4]);
    swipe(-60);
    expect(shown()).toEqual([0, 1, 2]);

    // A trackpad sends one flick in pieces, and they add up to one turn.
    fireEvent.wheel(list, { deltaX: 25, deltaY: 0 });
    expect(shown()).toEqual([0, 1, 2]);
    fireEvent.wheel(list, { deltaX: 25, deltaY: 0 });
    expect(shown()).toEqual([3, 4]);
  });

  it("leaves a gesture that is more up-and-down than sideways to the stack", () => {
    stubLayout(1000, 5, { height: 200, chrome: 130, itemHeight: 20 });
    const { container } = render(<CvSection />);

    const list = container.querySelector("ul")!;
    const shown = () =>
      [...list.children].flatMap((item, j) => (item.className.includes("invisible") ? [] : [j]));

    // The stack above reads these for its own up-and-down, so a swipe that is
    // mostly vertical must not turn a page on the way past.
    fireEvent.touchStart(list, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchEnd(list, { changedTouches: [{ clientX: 160, clientY: 60 }] });
    expect(shown()).toEqual([0, 1, 2]);

    fireEvent.wheel(list, { deltaX: 50, deltaY: 80 });
    expect(shown()).toEqual([0, 1, 2]);
  });

  it("offers no pager while every bullet is showing", () => {
    stubLayout(1000, 5, { height: 300, chrome: 100, itemHeight: 20 });
    render(<CvSection />);

    expect(screen.queryByRole("button", { name: "Next bullets" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Previous bullets" })).toBeNull();
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

  it("turns its pages: a flick moves the stack to the next one", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
    const { container } = render(<CvSection />);
    const stack = container.firstElementChild as HTMLElement;
    // jsdom has no layout, so the pages are given the heights they would have.
    [...stack.children].forEach((page, i) =>
      Object.defineProperty(page, "offsetTop", { value: i * 100, configurable: true }),
    );

    act(() => void stack.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, cancelable: true })));
    act(() => void vi.advanceTimersByTime(200));

    expect(stack.scrollTop).toBe(100);
    vi.useRealTimers();
  });
});

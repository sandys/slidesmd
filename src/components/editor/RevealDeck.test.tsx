import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { RevealDeck } from "./RevealDeck";

// Mock reveal.js and its plugins so the component can mount in jsdom.
const deckMock = {
  initialize: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  sync: vi.fn(),
  slide: vi.fn(),
  layout: vi.fn(),
  on: vi.fn(),
  getIndices: vi.fn(() => ({ h: 0, v: 0 })),
  getCurrentSlide: vi.fn(() => null),
};
vi.mock("reveal.js", () => ({
  default: vi.fn(() => deckMock),
}));
vi.mock("reveal.js/plugin/markdown/markdown.esm.js", () => ({ default: {} }));
vi.mock("reveal.js/plugin/notes/notes.esm.js", () => ({ default: {} }));
vi.mock("reveal.js/plugin/highlight/highlight.esm.js", () => ({ default: {} }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RevealDeck", () => {
  // Regression guard for the JSX-escaping bug: the separator attributes on the
  // real DOM must be regexes that split plain \n---\n / \n--\n markdown.
  it("builds a markdown section whose separators split slides", () => {
    const { container } = render(
      <RevealDeck doc={"# A\n---\n# B"} mode="present" themeFallback="black.css" />,
    );
    const section = container.querySelector("section[data-markdown]")!;
    expect(section).not.toBeNull();

    const sep = section.getAttribute("data-separator")!;
    const vsep = section.getAttribute("data-separator-vertical")!;
    const notes = section.getAttribute("data-separator-notes")!;

    expect(new RegExp(sep, "mg").test("# A\n---\n# B")).toBe(true);
    expect(new RegExp(vsep, "mg").test("# A\n--\n# B")).toBe(true);
    expect("# A\n---\n# B".split(new RegExp(`${sep}|${vsep}`, "mg"))).toEqual(["# A", "# B"]);
    expect(new RegExp(notes, "mgi").test("  Note: for the speaker")).toBe(true);

    // The template section must stay attribute-clean apart from data-markdown
    // and the separators (extra attributes are forwarded to every slide).
    const attrs = Array.from(section.attributes).map((a) => a.name).sort();
    expect(attrs).toEqual([
      "data-markdown",
      "data-separator",
      "data-separator-notes",
      "data-separator-vertical",
    ]);
  });

  it("round-trips content that contains a closing script tag", () => {
    const doc = '# A\n\n<script>alert("</script>")</script>';
    const { container } = render(<RevealDeck doc={doc} mode="view" />);
    const template = container.querySelector("script[type='text/template']")!;
    expect(template.textContent).toBe(doc);
  });

  it("strips front matter from the template and themes from it", async () => {
    const { container } = render(
      <RevealDeck doc={"---\ntheme: sky.css\n---\n# A"} mode="view" themeFallback="black.css" />,
    );
    const template = container.querySelector("script[type='text/template']")!;
    expect(template.textContent).toBe("# A");
    expect(template.textContent).not.toContain("theme:");
    await waitFor(() => {
      expect(document.head.querySelector('link[href="/themes/sky.css"]')).not.toBeNull();
    });
  });

  it("falls back to the presentation theme, normalized", async () => {
    render(<RevealDeck doc={"# A"} mode="view" themeFallback="moon" />);
    await waitFor(() => {
      expect(document.head.querySelector('link[href="/themes/moon.css"]')).not.toBeNull();
    });
  });

  it("initializes reveal with the markdown, highlight and notes plugins", async () => {
    const Reveal = (await import("reveal.js")).default as unknown as ReturnType<typeof vi.fn>;
    render(<RevealDeck doc={"# A"} mode="present" />);
    await waitFor(() => expect(Reveal).toHaveBeenCalled());
    const config = Reveal.mock.calls[0][1] as { plugins: unknown[]; slideNumber?: string };
    expect(config.plugins).toHaveLength(3);
    expect(config.slideNumber).toBe("c");
    await waitFor(() => expect(deckMock.initialize).toHaveBeenCalled());
  });

  it("applies front matter reveal overrides", async () => {
    const Reveal = (await import("reveal.js")).default as unknown as ReturnType<typeof vi.fn>;
    render(
      <RevealDeck
        doc={"---\ntransition: fade\nslideNumber: false\nwidth: 1280\n---\n# A"}
        mode="present"
      />,
    );
    await waitFor(() => expect(Reveal).toHaveBeenCalled());
    const config = Reveal.mock.calls[0][1] as {
      transition: string;
      slideNumber: boolean;
      width: number;
    };
    expect(config.transition).toBe("fade");
    expect(config.slideNumber).toBe(false);
    expect(config.width).toBe(1280);
  });
});

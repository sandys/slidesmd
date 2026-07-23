import { describe, it, expect } from "vitest";
import {
  HORIZONTAL_SEPARATOR,
  VERTICAL_SEPARATOR,
  NOTES_SEPARATOR,
  parseFrontMatter,
  setFrontMatterValue,
  joinLegacySlides,
  normalizeThemeFile,
  expandContainers,
  processDoc,
} from "./markdown";

describe("separator constants", () => {
  // Regression guard for the JSX-escaping bug: the values must be regexes that
  // split plain \n---\n joins (the exact string legacy slides are joined with).
  it("split markdown on --- and --", () => {
    expect(new RegExp(HORIZONTAL_SEPARATOR, "mg").test("# A\n---\n# B")).toBe(true);
    expect(new RegExp(VERTICAL_SEPARATOR, "mg").test("# A\n--\n# B")).toBe(true);
    const combined = new RegExp(`${HORIZONTAL_SEPARATOR}|${VERTICAL_SEPARATOR}`, "mg");
    expect("# A\n---\n# B".split(combined)).toEqual(["# A", "# B"]);
    expect("# A\n--\n# B".split(combined)).toEqual(["# A", "# B"]);
    expect("# A\r\n---\r\n# B".split(combined)).toEqual(["# A", "# B"]);
  });

  it("matches speaker notes with leading whitespace, case-insensitively", () => {
    const notes = new RegExp(NOTES_SEPARATOR, "mgi");
    expect(notes.test("slide body\n  Note: only for the speaker")).toBe(true);
    expect(new RegExp(NOTES_SEPARATOR, "mgi").test("NOTES: shouting")).toBe(true);
    expect(new RegExp(NOTES_SEPARATOR, "mgi").test("denotes: nothing")).toBe(false);
  });
});

describe("parseFrontMatter", () => {
  it("returns the whole doc as body when there is no front matter", () => {
    const doc = "# Hello\n---\n# World";
    expect(parseFrontMatter(doc)).toEqual({ config: {}, body: doc });
  });

  it("parses keys and coerces types", () => {
    const doc = [
      "---",
      "theme: bento.css",
      "transition: fade",
      "width: 1280",
      "height: 720",
      "margin: 0.08",
      "center: false",
      "animateLists: true",
      "showNotes: true",
      "slideNumber: c/t",
      "accent: #F7A600",
      "unknownKey: ignored",
      "---",
      "# Slide",
    ].join("\n");
    const { config, body } = parseFrontMatter(doc);
    expect(config).toEqual({
      theme: "bento.css",
      transition: "fade",
      width: 1280,
      height: 720,
      margin: 0.08,
      center: false,
      animateLists: true,
      showNotes: true,
      slideNumber: "c/t",
      accent: "#F7A600",
    });
    expect(body).toBe("# Slide");
  });

  it("coerces slideNumber booleans", () => {
    expect(parseFrontMatter("---\nslideNumber: true\n---\nx").config.slideNumber).toBe(true);
    expect(parseFrontMatter("---\nslideNumber: false\n---\nx").config.slideNumber).toBe(false);
  });

  it("handles \\r\\n line endings", () => {
    const doc = "---\r\ntheme: sky.css\r\n---\r\n# Slide";
    const { config, body } = parseFrontMatter(doc);
    expect(config.theme).toBe("sky.css");
    expect(body).toBe("# Slide");
  });

  it("treats a doc starting with a slide separator as content, not front matter", () => {
    // "# A" is not a key: value line, so this is not a front matter block.
    const doc = "---\n# A\n---\n# B";
    expect(parseFrontMatter(doc)).toEqual({ config: {}, body: doc });
  });

  it("requires a closing --- line", () => {
    const doc = "---\ntheme: sky.css\n# never closed";
    expect(parseFrontMatter(doc)).toEqual({ config: {}, body: doc });
  });

  it("accepts an empty front matter block", () => {
    const { config, body } = parseFrontMatter("---\n---\n# Slide");
    expect(config).toEqual({});
    expect(body).toBe("# Slide");
  });
});

describe("setFrontMatterValue", () => {
  it("replaces an existing key", () => {
    const doc = "---\ntheme: black.css\ntransition: fade\n---\n# S";
    expect(setFrontMatterValue(doc, "theme", "sky.css")).toBe(
      "---\ntheme: sky.css\ntransition: fade\n---\n# S",
    );
  });

  it("inserts into an existing block when the key is absent", () => {
    const doc = "---\ntransition: fade\n---\n# S";
    expect(setFrontMatterValue(doc, "theme", "sky.css")).toBe(
      "---\ntheme: sky.css\ntransition: fade\n---\n# S",
    );
  });

  it("prepends a new block when the doc has no front matter", () => {
    expect(setFrontMatterValue("# S", "theme", "sky.css")).toBe(
      "---\ntheme: sky.css\n---\n\n# S",
    );
  });

  it("round-trips through parseFrontMatter", () => {
    const doc = setFrontMatterValue("# S", "theme", "moon.css");
    expect(parseFrontMatter(doc).config.theme).toBe("moon.css");
    expect(parseFrontMatter(doc).body.trim()).toBe("# S");
  });
});

describe("helpers", () => {
  it("joins legacy slides with the horizontal separator", () => {
    expect(joinLegacySlides(["# A", "# B"])).toBe("# A\n---\n# B");
    expect(joinLegacySlides(["# only"])).toBe("# only");
  });

  it("normalizes theme file names", () => {
    expect(normalizeThemeFile("bento")).toBe("bento.css");
    expect(normalizeThemeFile("bento.css")).toBe("bento.css");
    expect(normalizeThemeFile("  sky ")).toBe("sky.css");
  });
});

describe("expandContainers", () => {
  it("returns docs without containers unchanged", () => {
    const body = "# A\n\n- one\n- two\n---\n# B";
    expect(expandContainers(body)).toBe(body);
  });

  it("wraps a simple container in divs surrounded by blank lines", () => {
    // Blank lines around the tags are load-bearing: marked 4.3 only renders
    // markdown inside an HTML block when they are present.
    expect(expandContainers("::: card\n\nHi\n\n:::")).toBe(
      '\n<div class="card">\n\n\nHi\n\n\n</div>\n',
    );
  });

  it("supports multiple classes", () => {
    expect(expandContainers("::: card accent\n\nHi\n\n:::")).toContain(
      '<div class="card accent">',
    );
  });

  it("expands cols with an implicit first column and :::split", () => {
    const out = expandContainers("::: cols\n\nLeft\n\n:::split\n\nRight\n\n:::");
    const divs = out.match(/<div class="(cols|col)">/g);
    expect(divs).toEqual(['<div class="cols">', '<div class="col">', '<div class="col">']);
    expect(out.match(/<\/div>/g)).toHaveLength(3);
    expect(out.indexOf("Left")).toBeLessThan(out.indexOf("Right"));
    // every tag line has a blank line on each side
    for (const line of out.split("\n")) {
      if (line.startsWith("<div") || line.startsWith("</div")) {
        const idx = out.split("\n").indexOf(line);
        expect(out.split("\n")[idx - 1]).toBe("");
      }
    }
  });

  it("supports nesting", () => {
    const out = expandContainers("::: cols\n\n::: card\n\nHi\n\n:::\n\n:::");
    expect(out.match(/<\/div>/g)).toHaveLength(3); // card + implicit col + cols
  });

  it("leaves ::: lines inside code fences untouched", () => {
    const body = "```\n::: card\n:::\n```";
    expect(expandContainers(body)).toBe(body);
    const tildes = "~~~\n::: card\n~~~";
    expect(expandContainers(tildes)).toBe(tildes);
  });

  it("auto-closes open containers at slide separators", () => {
    const out = expandContainers("::: card\n\nHi\n---\n# Next");
    expect(out).toContain("</div>");
    expect(out.indexOf("</div>")).toBeLessThan(out.indexOf("---"));
    // the separator still splits: it must sit on its own line with newlines around it
    expect(new RegExp(HORIZONTAL_SEPARATOR, "mg").test(out)).toBe(true);
  });

  it("auto-closes open containers at end of document", () => {
    const out = expandContainers("::: card\n\nHi");
    expect(out.match(/<\/div>/g)).toHaveLength(1);
  });

  it("leaves stray ::: and :::split lines verbatim when no container is open", () => {
    expect(expandContainers(":::")).toBe(":::");
    expect(expandContainers(":::split")).toBe(":::split");
  });
});

describe("processDoc", () => {
  it("strips front matter and expands containers", () => {
    const doc = "---\ntheme: sky.css\n---\n::: card\n\nHi\n\n:::";
    const { config, markdown } = processDoc(doc);
    expect(config.theme).toBe("sky.css");
    expect(markdown).not.toContain("theme:");
    expect(markdown).toContain('<div class="card">');
  });
});

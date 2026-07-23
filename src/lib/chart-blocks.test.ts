import { describe, it, expect } from "vitest";
import { parseChartFence, enhanceChartBlocks } from "./chart-blocks";
import { deriveChartPalette, applyChartPalette } from "@/vendor/bento/palette";

const BAR_OPTION = JSON.stringify({
  xAxis: { type: "category", data: ["A", "B"] },
  yAxis: { type: "value" },
  series: [{ type: "bar", data: [1, 2] }],
});

describe("parseChartFence", () => {
  it("parses a plain option", () => {
    const parsed = parseChartFence(BAR_OPTION);
    expect(parsed).not.toBeNull();
    expect(parsed!.height).toBe(400);
    expect(Array.isArray(parsed!.option.series)).toBe(true);
  });

  it("merges over a preset seed and strips slidesmd-only keys", () => {
    const parsed = parseChartFence(
      JSON.stringify({ preset: "bar", height: 320, series: [{ type: "bar", data: [5] }] }),
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.height).toBe(320);
    const option = parsed!.option;
    expect(option.preset).toBeUndefined();
    expect(option.height).toBeUndefined();
    // series overridden by the fence, xAxis inherited from the preset seed
    expect((option.series as unknown[]).length).toBe(1);
    expect(option.xAxis).toBeDefined();
  });

  it("returns null for invalid JSON and non-objects", () => {
    expect(parseChartFence("not json")).toBeNull();
    expect(parseChartFence("[1,2]")).toBeNull();
    expect(parseChartFence('"str"')).toBeNull();
  });
});

describe("enhanceChartBlocks", () => {
  const build = (codeHtml: string) => {
    const root = document.createElement("div");
    root.innerHTML = `<section><pre><code class="chart"></code></pre></section>`;
    root.querySelector("code")!.textContent = codeHtml;
    return root;
  };

  it("replaces a valid chart fence with an SVG snapshot", () => {
    const root = build(BAR_OPTION);
    enhanceChartBlocks(root, "#F7A600");
    expect(root.querySelector("pre")).toBeNull();
    const block = root.querySelector(".chart-block")!;
    expect(block).not.toBeNull();
    expect(block.innerHTML).toContain("<svg");
    expect(block.getAttribute("data-chart-processed")).toBe("true");
    // stored option carries the derived palette
    const stored = JSON.parse(block.getAttribute("data-chart-el")!) as {
      option: { color: string[] };
      h: number;
    };
    expect(stored.option.color[0]).toBe("#F7A600");
    expect(stored.h).toBe(400);
  });

  it("is idempotent", () => {
    const root = build(BAR_OPTION);
    enhanceChartBlocks(root, "#F7A600");
    const html = root.innerHTML;
    enhanceChartBlocks(root, "#F7A600");
    expect(root.innerHTML).toBe(html);
  });

  it("leaves invalid JSON visible as a code block", () => {
    const root = build("{ broken");
    enhanceChartBlocks(root, "#F7A600");
    const pre = root.querySelector("pre")!;
    expect(pre).not.toBeNull();
    expect(pre.getAttribute("data-chart-processed")).toBe("invalid");
    expect(root.querySelector(".chart-block")).toBeNull();
    // and does not retry
    enhanceChartBlocks(root, "#F7A600");
    expect(root.querySelector("pre")).not.toBeNull();
  });

  it("skips chart fences with line numbers", () => {
    const root = build(BAR_OPTION);
    root.querySelector("code")!.setAttribute("data-line-numbers", "1-2");
    enhanceChartBlocks(root, "#F7A600");
    expect(root.querySelector("pre")).not.toBeNull();
    expect(root.querySelector(".chart-block")).toBeNull();
  });

  it("renders pie charts too", () => {
    const root = build(JSON.stringify({ preset: "pie" }));
    enhanceChartBlocks(root, "#F7A600");
    expect(root.querySelector(".chart-block")!.innerHTML).toContain("path");
  });
});

describe("palette", () => {
  it("derives six colors from the accent", () => {
    const palette = deriveChartPalette("#F7A600");
    expect(palette).toHaveLength(6);
    expect(palette[0]).toBe("#F7A600");
    palette.slice(1).forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it("falls back to a stock palette for invalid accents", () => {
    expect(deriveChartPalette("")).toEqual(["#5470c6", "#91cc75", "#fac858", "#ee6666"]);
  });

  it("does not override an explicit option color", () => {
    const option = { color: ["#111111"] };
    applyChartPalette(option, { accent: "#F7A600" });
    expect(option.color).toEqual(["#111111"]);
  });
});

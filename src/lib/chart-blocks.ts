// ```chart fenced blocks → SVG charts (vendored bento charts-lite engine).
// The markdown plugin renders the fence as <pre><code class="chart">…</code>;
// after reveal initializes we parse the JSON and swap the block for a chart.

import {
  CHART_PRESETS,
  chartSnapshotSvg,
  mountChart,
  type ChartLike,
} from "@/vendor/bento/charts";
import { applyChartPalette } from "@/vendor/bento/palette";

const PROCESSED_ATTR = "data-chart-processed";
const OPTION_ATTR = "data-chart-el";
const DEFAULT_WIDTH = 860;
const DEFAULT_HEIGHT = 400;

export interface ParsedChartFence {
  option: Record<string, unknown>;
  height: number;
}

// Fence JSON is an ECharts-shaped option, optionally with two slidesmd-only
// keys: "preset" (bar|line|pie|scatter seed the rest merges over) and
// "height" (px). Returns null when the JSON is invalid — the caller leaves
// the code block visible as the error affordance.
export function parseChartFence(text: string): ParsedChartFence | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;

  const obj = { ...(raw as Record<string, unknown>) };
  const presetName = typeof obj.preset === "string" ? obj.preset : undefined;
  delete obj.preset;
  const height =
    typeof obj.height === "number" && Number.isFinite(obj.height) && obj.height > 0
      ? obj.height
      : DEFAULT_HEIGHT;
  delete obj.height;

  const seed = presetName ? CHART_PRESETS[presetName]?.() : undefined;
  const option = seed ? { ...seed, ...obj } : obj;
  return { option, height };
}

// Replaces every unprocessed ```chart block under `root` with a static SVG
// snapshot. Runs on reveal `ready` (and again on `pdf-ready`); idempotent via
// a marker attribute. Print mode lays out every slide at once, which is why
// this walks the whole deck rather than the current slide.
export function enhanceChartBlocks(root: HTMLElement, accent: string): void {
  const codes = root.querySelectorAll<HTMLElement>(
    "pre code.chart, pre code.language-chart",
  );
  codes.forEach((code) => {
    const pre = code.closest("pre");
    if (!pre || pre.hasAttribute(PROCESSED_ATTR)) return;
    if (code.hasAttribute("data-line-numbers")) return; // line-number table would mangle the JSON

    const parsed = parseChartFence(code.textContent ?? "");
    if (!parsed) {
      pre.setAttribute(PROCESSED_ATTR, "invalid");
      return;
    }

    const option = applyChartPalette({ ...parsed.option }, { accent });
    const chart: ChartLike = {
      w: pre.offsetWidth || DEFAULT_WIDTH,
      h: parsed.height,
      option,
    };

    const block = document.createElement("div");
    block.className = "chart-block";
    block.setAttribute(PROCESSED_ATTR, "true");
    block.setAttribute(OPTION_ATTR, JSON.stringify(chart));
    block.style.height = `${chart.h}px`;
    block.innerHTML = chartSnapshotSvg(chart);
    pre.replaceWith(block);
  });
}

// Upgrades the static snapshots inside one slide to live charts (tooltips,
// wheel-zoom/pan when dataZoom is set). Returns a disposer that restores the
// static snapshots. Used in view/present modes on slidechanged.
export function mountLiveCharts(slideEl: HTMLElement): () => void {
  const disposers: Array<() => void> = [];
  slideEl.querySelectorAll<HTMLElement>(".chart-block").forEach((block) => {
    try {
      const chart = JSON.parse(block.getAttribute(OPTION_ATTR) ?? "") as ChartLike;
      const snapshot = block.innerHTML;
      const dispose = mountChart(chart, block);
      disposers.push(() => {
        dispose();
        block.innerHTML = snapshot;
      });
    } catch {
      // leave the static snapshot in place
    }
  });
  return () => {
    disposers.forEach((dispose) => dispose());
  };
}

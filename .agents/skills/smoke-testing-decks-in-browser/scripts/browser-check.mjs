// Drive headless Chromium over a seeded smoke deck and assert the deck
// actually renders (slides split, layouts, charts, notes, print view).
// Run from the repo root with the dev or prod server on :3000:
//   KEY=<key from seed-deck.mjs> node .agents/skills/smoke-testing-decks-in-browser/scripts/browser-check.mjs
// Needs playwright-core (npm i --no-save playwright-core) and a Playwright
// Chromium (npx -y playwright install chromium). Exits non-zero on failure.
import { readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const KEY = process.env.KEY ?? process.argv[2];
if (!KEY) {
  console.error("usage: KEY=<urlsafe-key> node browser-check.mjs");
  process.exit(2);
}
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let chromium;
try {
  ({ chromium } = createRequire(join(process.cwd(), "package.json"))("playwright-core"));
} catch {
  console.error("playwright-core missing - run: npm i --no-save playwright-core");
  process.exit(2);
}

function findChromium() {
  const root = join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(root)) return null;
  const dirs = readdirSync(root)
    .filter((d) => d.startsWith("chromium"))
    .sort()
    .reverse();
  for (const dir of dirs) {
    for (const rel of ["chrome-linux64/chrome", "chrome-linux/chrome", "chrome-linux/headless_shell"]) {
      const p = join(root, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

const executablePath = findChromium();
if (!executablePath) {
  console.error("no Playwright Chromium found - run: npx -y playwright install chromium");
  process.exit(2);
}

const failures = [];
const check = (name, ok) => {
  console.log(`${ok ? "ok " : "FAIL"} ${name}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e.message)));

// presenter: full pipeline (separators, layout kit, chart fence, notes)
await page.goto(`${BASE}/present/p/smoketest/h#${KEY}`);
await page.waitForSelector(".reveal .slides section", { timeout: 20000 });
await page.waitForTimeout(2500);
const present = await page.evaluate(() => ({
  slides: document.querySelectorAll(".reveal .slides > section").length,
  cols: !!document.querySelector(".reveal .cols > .col"),
  chart: !!document.querySelector(".chart-block svg"),
  chartLeftover: !!document.querySelector("pre code.chart"),
  notes: !!document.querySelector("aside.notes"),
  theme: document.querySelector('link[href^="/themes/"]')?.getAttribute("href") ?? "",
}));
check("presenter splits slides (---)", present.slides >= 3);
check("layout kit renders ::: cols", present.cols);
check("chart fence rendered to SVG", present.chart && !present.chartLeftover);
check("speaker notes extracted", present.notes);
check("front-matter theme loaded", present.theme.includes("bento.css"));

// deck chrome: progress bar, positioned slide numbers, footer tokens,
// per-slide header override
const chrome = await page.evaluate(() => ({
  progressHeight: document.querySelector(".reveal .progress")?.clientHeight ?? 0,
  slideNumber: document.querySelector(".reveal .slide-number")?.textContent ?? "",
  positionClass: document.querySelector(".reveal")?.className.includes("sn-top-right") ?? false,
  footer: document.querySelector(".reveal > .deck-footer")?.textContent ?? "",
  headerHidden: (document.querySelector(".reveal > .deck-header")?.textContent ?? "") === "",
}));
check("progress bar visibly sized (>= 4px)", chrome.progressHeight >= 4);
check("slide number rendered (c/t)", /1\s*\/\s*\d/.test(chrome.slideNumber));
check("slide number position class applied", chrome.positionClass);
check("footer renders {{page}}/{{total}} tokens", /smoke deck · 1\/\d+/.test(chrome.footer));
check("no header on slide 1 (deck default unset)", chrome.headerHidden);

await page.keyboard.press("ArrowRight");
await page.waitForTimeout(800);
const chrome2 = await page.evaluate(() => ({
  header: document.querySelector(".reveal > .deck-header")?.textContent ?? "",
  footer: document.querySelector(".reveal > .deck-footer")?.textContent ?? "",
  progressFill: document.querySelector(".reveal .progress span")?.clientWidth ?? 0,
}));
check("per-slide data-header override shows on slide 2", chrome2.header === "Custom header");
check("footer page token advances", /· 2\/\d+/.test(chrome2.footer));
check("progress bar fills as the deck advances", chrome2.progressFill > 0);
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(500);

// viewer must agree with the presenter (one slide model everywhere)
await page.goto(`${BASE}/p/smoketest/v#${KEY}`);
await page.waitForSelector(".reveal .slides section", { timeout: 20000 });
await page.waitForTimeout(1500);
const viewSlides = await page.evaluate(
  () => document.querySelectorAll(".reveal .slides > section").length,
);
check("viewer slide count matches presenter", viewSlides === present.slides);

// editor scroll-sync: navigating the preview highlights the active slide's
// markdown in the left pane and scrolls it into view
await page.goto(`${BASE}/p/smoketest/e/smokeeditkey/h#${KEY}`);
await page.waitForSelector("textarea", { timeout: 20000 });
await page.waitForTimeout(2000);
const initialHighlight = await page.evaluate(
  () => document.querySelector("[data-editor-highlight]")?.textContent ?? "",
);
check("editor highlights first slide on load", initialHighlight.includes("# Smoke A"));
const previewChrome = await page.evaluate(() => ({
  footer: document.querySelector(".reveal > .deck-footer")?.textContent ?? "",
  progressHeight: document.querySelector(".reveal .progress")?.clientHeight ?? 0,
}));
check("preview pane shows the footer chrome", previewChrome.footer.includes("smoke deck"));
check("preview pane progress bar visibly sized", previewChrome.progressHeight >= 4);
await page.click(".reveal .controls .navigate-right");
await page.waitForTimeout(1200);
const nextHighlight = await page.evaluate(
  () => document.querySelector("[data-editor-highlight]")?.textContent ?? "",
);
check("navigating preview moves the editor highlight", nextHighlight.includes("## Smoke B"));

// editor slideshow: Present button opens a fullscreen overlay deck over the
// live document; the ✕ button closes it again
// exact:true — "text=Present" would substring-match the "Edit Presentation" heading
await page.getByRole("button", { name: "Present", exact: true }).click();
await page.waitForTimeout(2500);
const slideshow = await page.evaluate(() => {
  const overlay = document.querySelector(".fixed.inset-0 .reveal");
  return {
    open: !!overlay,
    slides: overlay ? overlay.querySelectorAll(".slides > section").length : 0,
    fullscreen: !!document.fullscreenElement,
  };
});
check("Present opens slideshow overlay", slideshow.open);
check("slideshow renders all slides", slideshow.slides === present.slides);
check("slideshow entered browser fullscreen", slideshow.fullscreen);
await page.click('[aria-label="Exit slideshow"]');
await page.waitForTimeout(800);
const slideshowClosed = await page.evaluate(
  () => !document.querySelector(".fixed.inset-0 .reveal"),
);
check("Exit button closes slideshow", slideshowClosed);

// print view lays out pdf pages
await page.goto(`${BASE}/present/p/smoketest/h?print-pdf#${KEY}`);
await page.waitForTimeout(4000);
const print = await page.evaluate(() => ({
  pages: document.querySelectorAll(".pdf-page").length,
  chart: !!document.querySelector(".chart-block svg"),
}));
check("print view produces pdf pages", print.pages >= present.slides);
check("charts present in print view", print.chart);

check("no page errors on any surface", pageErrors.length === 0);
if (pageErrors.length) console.error("page errors:", pageErrors.slice(0, 5));

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nall checks passed");

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

// viewer must agree with the presenter (one slide model everywhere)
await page.goto(`${BASE}/p/smoketest/v#${KEY}`);
await page.waitForSelector(".reveal .slides section", { timeout: 20000 });
await page.waitForTimeout(1500);
const viewSlides = await page.evaluate(
  () => document.querySelectorAll(".reveal .slides > section").length,
);
check("viewer slide count matches presenter", viewSlides === present.slides);

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

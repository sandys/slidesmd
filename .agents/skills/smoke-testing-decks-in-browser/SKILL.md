---
name: smoke-testing-decks-in-browser
description: >-
  Verify that slidesmd decks actually render in a real browser: seed an
  encrypted test deck into dev.db, drive headless Chromium over the editor,
  viewer, presenter and print-pdf surfaces, and assert slides split, layouts
  and charts render, notes extract, and no page errors occur. Use after any
  change to RevealDeck, src/lib/markdown.ts, chart-blocks, fx, themes,
  slides-kit.css, or reveal.js config/version - and whenever the user says
  "smoke test", "check the deck renders", or "verify in a browser". jsdom unit
  tests cannot catch reveal rendering bugs (the historic separator bug passed
  every unit test); this skill is the check that would have caught it.
---

# Smoke-testing decks in a real browser

## When to use
After changing anything in the render pipeline (`RevealDeck.tsx`,
`src/lib/markdown.ts`, `src/lib/chart-blocks.ts`, `src/lib/fx.ts`,
`src/styles/slides-kit.css`, `src/themes/`, reveal.js version/config), before
merging such a change, or when a rendering bug is suspected. Not needed for
pure server/action/crypto changes - vitest covers those.

## Workflow
1. From the repo root, one-time per machine:
   `npm i --no-save playwright-core` (does not touch package.json) and
   `npx -y playwright install chromium` (downloads to `~/.cache/ms-playwright`).
2. Start a server on :3000 - `npm run dev` (or `npm run build && npm start`
   to test the production bundle). Wait until `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` prints 200.
3. Seed the encrypted test deck (public id `smoketest`):
   `node .agents/skills/smoke-testing-decks-in-browser/scripts/seed-deck.mjs`
   Expect `KEY=...` plus EDIT/VIEW/PRESENT URLs on stdout.
4. Run the browser checks with that key:
   `KEY=<key> node .agents/skills/smoke-testing-decks-in-browser/scripts/browser-check.mjs`
   Expect every line to start with `ok` and a final `all checks passed`.
5. Always clean up (dev.db is committed to the repo):
   `node .agents/skills/smoke-testing-decks-in-browser/scripts/seed-deck.mjs --cleanup`
6. Stop the server you started (`pkill -f next-server` if needed).

## Failure modes
- `playwright-core missing` -> `npm i --no-save playwright-core` from the repo root.
- `no Playwright Chromium found` -> `npx -y playwright install chromium` (~110 MB).
- Checks time out on `.reveal .slides section` -> the deck never initialized:
  open the PRESENT URL manually and look at the browser console; a wrong
  separator regex or a plugin import crash is the usual cause.
- `presenter splits slides` fails with slides=1 -> separator regression: the
  DOM `data-separator` must be the unanchored `\r?\n---\r?\n` (JSX keeps
  backslashes verbatim - see REPO_GUIDE.md Gotchas).
- Port 3000 already in use -> `pkill -f next-server; pkill -f "next dev"`.
- Do NOT try to assert rendering through vitest/jsdom instead - reveal's
  layout, CSS and plugin pipeline don't run there; that approach has already
  hidden real bugs.
- Seeding must mirror `src/lib/crypto.ts` exactly (AES-256-GCM, 12-byte IV
  prepended, standard base64 stored, URL-safe base64 key). If crypto.ts
  changes, update `scripts/seed-deck.mjs` in the same commit.

## Done when
- `browser-check.mjs` prints `all checks passed` and exits 0.
- The smoke deck is removed (`--cleanup` ran; `git status` shows no unexpected
  dev.db churn beyond what you already had).
- Any server this skill started is stopped.

# slidesmd — guide for AI agents & humans

> Canonical agent context. `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` at the repo
> root are symlinks to this file — edit it here, nowhere else. Reusable
> procedures live in `.agents/skills/`.

## What this is
slidesmd is a markdown-first presentation tool on reveal.js 5.2.1: a deck is
ONE markdown document (front matter + `---`/`--` separators) rendered
identically in the editor preview, viewer and presenter — deliberately the
opposite of WYSIWYG tools like nyblnet/bento. Content is encrypted client-side
(AES-256-GCM); the key lives only in the URL `#fragment`, so the server stores
ciphertext it can never read. Authoring dialect reference: `docs/authoring.md`.

## Commands
- Setup: `npm install`
- Dev server: `npm run dev` (regenerates themes, then Next 15 turbopack on :3000)
- Build: `npm run build` (includes type-check; CI does NOT run build — run it yourself when touching types/config)
- Test all: `npx vitest run` — single file: `npx vitest run src/lib/markdown.test.ts`
- Lint: `npm run lint`
- Themes: `npm run generate-themes` (copies reveal dist + `src/themes/*.css` → `public/themes/`, writes `src/lib/themes.ts`; both outputs are git-ignored)
- Doc-sync hook (once per clone): `bash .agents/hooks/pre-commit --install`

## Architecture
- Next.js 15 App Router + React 19 + TS strict; Tailwind 4 + shadcn/ui; Drizzle + libSQL (`file:dev.db`, committed to the repo).
- Routes: `/` create → `/p/[id]/e/[editKey]/h` editor · `/p/[id]/h` read-only editor · `/p/[id]/v` viewer · `/present/p/[id]/h` presenter (`?print-pdf` before the `#key` = PDF export). The `h` path segment is a literal.
- `src/app/actions.ts` server actions are the whole data layer; editKey verified against a bcrypt hash; a deck is ONE encrypted slide row (legacy multi-row decks join client-side with `\n---\n` and collapse to one row on next save).
- Crypto: `src/lib/crypto.ts` — AES-GCM, stored as base64(IV‖ciphertext); URL-safe base64 key export.
- Markdown pipeline: `src/lib/markdown.ts` — front matter parsing, `:::` container expansion, separator constants shared by every surface, and `slideRangeForIndices` (slide indices → source char range; powers the editor's scroll-sync highlight via `MarkdownPane`, a metrics-matched backdrop behind the textarea — its font/padding/wrap classes must stay identical in both layers).
- `src/components/editor/RevealDeck.tsx` is the ONLY reveal renderer (modes: preview/view/present/slideshow — slideshow is the editor's Present button: an embedded fullscreen overlay of the live doc; `requestFullscreen` must run inside the click's transient-activation window, which is why it is an in-page overlay and not a new tab). `DecryptionWrapper` (mode prop) decrypts and routes to `PresentationEditor` or `RevealDeck`.
- Post-init enhancers: `src/lib/chart-blocks.ts` (```chart fences → SVG) and `src/lib/fx.ts` (`fx-countup`, `fx-enter-*`, `fx-kenburns`). Deck chrome (front-matter `header`/`footer` with `{{page}}`/`{{total}}`/`{{date}}` tokens, per-slide `data-header`/`data-footer` overrides, `slideNumberPosition`) is rendered by `RevealDeck` + `slides-kit.css`; in print it's injected per `.pdf-page`.
- `src/vendor/bento/` — MIT code vendored from nyblnet/bento (charts-lite, anim engine, palette); eslint-ignored; tracked in `THIRD_PARTY_NOTICES.md`.
- Layout kit: `src/styles/slides-kit.css` (driven by reveal `--r-*` vars, tunable via `--kit-*` hooks); custom themes in `src/themes/*.css` (bento theme embeds OFL fonts as data URIs, `@import`s white.css as substrate).
- Tests: vitest + jsdom + RTL; reveal modules and CSS are mocked (`src/test/setup.ts`); CI (`.github/workflows/ci.yml`): lint + vitest on Node 20.

## Conventions
- New UI primitives via the shadcn CLI (`npx shadcn-ui@latest add <component>`) so styling stays consistent.
- After changes run `npm run lint && npx vitest run` and fix everything before handing back or committing.
- PR-based flow into `main`; feature branches (`feature/<topic>`).
- Reveal config belongs in `RevealDeck`'s `buildRevealConfig` + front-matter keys — never scatter extra `Reveal` instances or init calls.
- No placeholder code or TODO stubs in committed work; readable over clever.

## Gotchas & environment notes
- JSX attribute strings do NOT process backslash escapes: `data-x="\r?\n"` reaches the DOM verbatim. (The pre-2026 separator bug `"^\\n---\\n$"` rendered whole decks as one slide.)
- The reveal markdown plugin replaces the template `<section>` via `outerHTML` — React must never own the deck subtree; `RevealDeck` builds it imperatively. Any extra attribute on the template section is forwarded to every generated slide.
- Bundled marked 4.3 renders markdown inside a `<div>` only when a blank line follows the opening tag and precedes the closing tag; the `:::` expander emits those blank lines — keep them.
- `reveal.js/plugin/highlight/highlight.esm.js` touches `window` at import time — dynamic-import only, or SSR crashes.
- reveal 5.2.1's default notes separator is broken (`^s*notes?:`, collapsed `\s`); always pass `NOTES_SEPARATOR` from `src/lib/markdown.ts`.
- The server can NEVER migrate slide content (zero-knowledge): content/schema migrations must run client-side after decryption.
- reveal.js ships no types; devDep `@types/reveal.js` also covers the plugin ESM import paths.
- One `Note:` block per slide (the plugin only splits on exactly 2 parts); chart fences must not carry `[...]` line-number ranges (the line-number table breaks JSON parsing).
- jsdom cannot catch reveal rendering bugs (regex/CSS issues pass unit tests) — run the `smoke-testing-decks-in-browser` skill for deck-rendering changes.
- Never run `npm run build` while `next dev` is running — they share `.next/` and the dev server starts returning 500s; stop dev, build, restart.

## Working rules for agents
- Immediately before **every commit**, and right after any substantial change
  (build/deps/CI/schema files, a new top-level directory, new or renamed
  commands, ~300+ changed lines): run the `syncing-docs-before-commit` skill
  and stage the `.agents/` updates with that commit. The pre-commit hook
  blocks substantial commits that skip this.
- At the end of any session where you solved something non-obvious: run the
  `capturing-session-knowledge` skill.
- Invoke skills with `/skill-name` (Claude Code) or `$skill-name` (Codex);
  Gemini CLI picks them up by description.

## Boundaries
- Never edit generated files: `public/themes/`, `src/lib/themes.ts`, `.next/`.
- Never hand-modify `src/vendor/bento/` beyond documented adaptations; preserve SPDX headers; update `THIRD_PARTY_NOTICES.md` when vendoring anything.
- Never log, store or send decrypted content or keys server-side — zero-knowledge is the product.
- Never push to `main`; never commit or push unless the user asks.
- Never run destructive DB operations on `dev.db` without confirmation (it is committed and doubles as the user's local data).

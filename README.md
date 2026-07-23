# slidesmd

**Markdown-first presentations with zero-knowledge encryption.**

A deck is one markdown document. Slides, themes, layouts, charts and
animations are all authored as text — the slides are generated from it, and
the same document renders identically in the editor preview, the shareable
viewer and the fullscreen presenter. Deliberately the opposite of a
drag-and-drop slide canvas: the text *is* the deck, so it diffs, greps and
plays nicely with AI agents.

Everything you write is encrypted in your browser (AES-256-GCM) before it
leaves the page. The decryption key lives only in the URL `#fragment`, which
browsers never send to servers — so the server stores ciphertext it can never
read. Whoever has the link has the deck; nobody else does, including the host.

Built on [reveal.js](https://revealjs.com), Next.js 15 and SQLite.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Create New
Presentation**. You'll land in a split editor — markdown on the left, the live
deck on the right — seeded with a showcase document that demonstrates the
whole dialect. As you flip through the preview, the editor highlights and
scrolls to the slide you're looking at.

## Writing a deck

````markdown
---
theme: bento.css
transition: fade
---

# The whole deck is this document

`---` starts a new slide, `--` a vertical one.

Note: lines after "Note:" only appear in the speaker view (press S).

---

## Layouts are markup

::: cols

Left column — plain markdown.

:::split

Right column.

:::

---

## Charts are JSON

```chart
{
  "preset": "bar",
  "xAxis": { "type": "category", "data": ["Q1", "Q2", "Q3", "Q4"] },
  "series": [{ "type": "bar", "data": [120, 480, 1400, 3200] }]
}
```
````

Also available: per-slide backgrounds and transitions via
`<!-- .slide: ... -->` comments, fragments and count-up/entrance effects via
`<!-- .element: ... -->`, morphing between slides with `data-auto-animate`,
stepped code highlighting (` ```js [1-2|4] `), cards/tiles/KPI layout classes,
and 15 themes (including the bundled `bento` theme with embedded open-source
fonts). The full dialect reference is **[docs/authoring.md](docs/authoring.md)**.

## Sharing and presenting

Each deck has two capabilities, both carried entirely by URLs:

| Link | Grants |
|---|---|
| `/p/<id>/e/<editKey>/h#<key>` | edit (keep this one private) |
| `/p/<id>/h#<key>` | read-only editor |
| `/p/<id>/v#<key>` | full-page viewer |
| `/present/p/<id>/h#<key>` | presenter — append `?print-pdf` **before** the `#` to export PDF |

The `#key` fragment is the decryption key and never reaches the server; the
`editKey` is verified against a bcrypt hash. Use the **Share** button to copy
the right links, **Present** for an instant fullscreen slideshow of your
current edits, and **Export to PDF** for a print-ready copy.

## Development

```bash
npm run dev            # regenerate themes + dev server (turbopack, :3000)
npx vitest run         # unit tests
npm run lint           # eslint
npm run build          # production build + type-check
npm run generate-themes  # reveal + src/themes/*.css -> public/themes/ (generated)
```

Don't run `npm run build` while the dev server is running — they share
`.next/`. jsdom can't catch reveal rendering regressions, so deck-rendering
changes should also run the headless-browser smoke test in
`.agents/skills/smoke-testing-decks-in-browser/`.

Agent/contributor documentation lives in
[`.agents/REPO_GUIDE.md`](.agents/REPO_GUIDE.md) (served as `AGENTS.md`,
`CLAUDE.md` and `GEMINI.md`), with reusable procedures under
`.agents/skills/`. Once per clone, wire the doc-freshness hook:
`bash .agents/hooks/pre-commit --install`.

New UI primitives should come from the [shadcn/ui CLI](https://ui.shadcn.com/docs/cli)
(`npx shadcn-ui@latest add <component>`) so styling stays consistent.

## Architecture in one paragraph

Next.js 15 App Router + React 19; server actions over Drizzle + libSQL
(`file:dev.db`) are the entire data layer, storing one encrypted row per deck.
`src/lib/crypto.ts` does AES-GCM in the browser;
`src/components/editor/RevealDeck.tsx` is the single reveal.js renderer for
every surface (preview, viewer, presenter, slideshow overlay);
`src/lib/markdown.ts` parses front matter, expands `:::` layout containers and
maps slide indices back to source ranges for the editor's scroll-sync
highlight. Charts and animation come from `src/vendor/bento/` — MIT code
vendored from [nyblnet/bento](https://github.com/nyblnet/bento) (see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).

## License

[GPL-3.0](LICENSE). Vendored code and embedded fonts keep their own licenses
(MIT / SIL OFL 1.1) — see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

# Authoring slidesmd decks

A presentation is **one markdown document**. Everything — slides, theme,
layouts, charts, animations — is authored as text; the slides are generated
from it. The same document renders identically in the editor preview, the
viewer (`/p/<id>/v`), and the presenter (`/present/p/<id>/h`).

## Slides

| Syntax | Meaning |
|---|---|
| `---` on its own line | New horizontal slide |
| `--` on its own line | New vertical slide (navigate with ↓) |

```markdown
# First slide

---

## Second slide

--

### Vertical child of the second slide
```

## Front matter (deck configuration)

An optional block of `key: value` lines at the very top of the document,
fenced by `---` lines. It is encrypted along with the rest of the content —
the server never sees it.

```markdown
---
theme: bento.css
transition: fade
slideNumber: c/t
---
```

| Key | Values | Default |
|---|---|---|
| `theme` | any theme file (`bento`, `black.css`, `dracula.css`, …) | `black.css` |
| `transition` | `none` `fade` `slide` `convex` `concave` `zoom` | `slide` |
| `transitionSpeed` | `default` `fast` `slow` | `default` |
| `backgroundTransition` | same options as `transition` | `fade` |
| `slideNumber` | `true` `false` `c` `c/t` `h.v` `h/v` | on (presenter) |
| `width` / `height` | slide design resolution in px | `960` / `700` |
| `margin` | empty space around slides, `0`–`1` | `0.04` |
| `center` | `true` / `false` — vertical centering | `true` |
| `animateLists` | `true` — every list item becomes a fragment | `false` |
| `showNotes` | `true` — render speaker notes inline (and in PDF) | `false` |
| `accent` | hex color used to derive the chart palette | theme link color |

Unknown keys are ignored. The theme selector in the editor simply rewrites
the `theme:` line — the document stays the single source of truth.

## Speaker notes

A line starting with `Note:` (or `Notes:`) begins the speaker notes for the
current slide. Press **S** in the presenter to open the speaker window.

```markdown
## Quarterly results

Revenue tripled.

Note: pause here and let it sink in. One Note: block per slide.
```

## Slide & element attributes

Any reveal.js `data-*` attribute can be set from markdown:

```markdown
<!-- .slide: data-background-gradient="linear-gradient(to bottom, #283b95, #17b2c3)" -->
## A slide with a gradient background

- Appears on click <!-- .element: class="fragment" -->
- Then this, highlighted <!-- .element: class="fragment highlight-red" -->
```

Useful slide attributes: `data-background-color`, `data-background-image`,
`data-background-video`, `data-background-iframe`, `data-background-gradient`,
`data-background-opacity`, `data-transition`, `data-visibility="hidden"`,
`data-auto-animate`.

Fragment classes: `fade-in` (default), `fade-out`, `fade-up/down/left/right`,
`fade-in-then-out`, `fade-in-then-semi-out`, `grow`, `shrink`, `strike`,
`highlight-red/green/blue`. Order with `data-fragment-index="2"`.

### Morph between slides (auto-animate)

Put `data-auto-animate` on two consecutive slides; matching elements tween
position, size and style — bento-style morph from pure markdown:

```markdown
<!-- .slide: data-auto-animate -->
# Big idea

---

<!-- .slide: data-auto-animate -->
# Big idea
### …now with a subtitle that slides in
```

## Layout containers

Layout classes ship with every theme. Write divs directly, or use the `:::`
sugar (a container is closed by `:::` and force-closed at the next slide):

```markdown
::: cols

### Left column

Plain markdown here.

:::split

### Right column

More markdown.

:::
```

`::: <classes>` opens a `<div class="...">`; `::: cols` also opens the first
column and `:::split` starts the next one. Containers nest:

```markdown
::: grid-3

::: card
**One**
:::

::: card
**Two**
:::

::: tile-gradient card
**Three**
:::

:::
```

Class catalog: `cols`/`col`, `grid-2`, `grid-3`, `card`, `tile`,
`tile-gradient`, `hero`, `kicker`, `kpi`, `kpi-label`, `quote`, `divider`,
`center`, `left`, `fit`, `muted`, `accent`, `rounded`, `cover-img`.

If you write raw divs instead of `:::`, keep a **blank line** after each
opening tag and before each closing tag — otherwise the markdown inside is
not processed.

## Charts

A ```` ```chart ```` fenced block containing JSON renders as an SVG chart
(bento's MIT-licensed charts-lite engine — ECharts-shaped options). Charts
are static images in the preview and PDF, and live (tooltips, wheel-zoom
when `dataZoom` is set) in the viewer/presenter.

````markdown
```chart
{
  "preset": "bar",
  "height": 380,
  "xAxis": { "type": "category", "data": ["Q1", "Q2", "Q3", "Q4"] },
  "series": [
    { "type": "bar", "name": "Signups", "data": [120, 480, 1400, 3200] },
    { "type": "line", "name": "Growth %", "yAxisIndex": 1, "data": [0, 300, 190, 129] }
  ],
  "yAxis": [{ "type": "value" }, { "type": "value", "axisLabel": { "formatter": "{value}%" } }],
  "tooltip": { "trigger": "axis" }
}
```
````

- `preset`: `bar` | `line` | `pie` | `scatter` — a seed the rest of the JSON
  merges over. `height`: chart height in px (default 400). Both keys are
  slidesmd-only; everything else is the ECharts-shaped subset.
- Supported: bar/line combos, dual y-axes via `yAxisIndex`, smooth lines,
  gradient `areaStyle` (`colorStops`), donut pies (`radius: ["38%", "68%"]`),
  pie `label.formatter` with `{b}` `{c}` `{d}`, `legend`, `grid`, `dataZoom`.
- Rules: bar/line `data` are plain numbers (only pie takes `{name, value}`);
  formatters are template strings, never functions; color is per series.
- The palette derives from the theme accent (or the `accent:` front matter
  key); set `"color": [...]` to override. Invalid JSON leaves the code block
  visible so you can fix it. Don't add a `[...]` highlight range to chart fences.

## Animation effects (fx)

Attach classes with `<!-- .element: ... -->`; they run when the slide is
shown in the viewer/presenter (never in PDF export, and they respect the
OS reduced-motion setting):

```markdown
<p class="kpi fx-countup">12,400</p>

- First point <!-- .element: class="fx-enter" -->
- Second point <!-- .element: class="fx-enter" -->
```

| Class | Effect |
|---|---|
| `fx-countup` | numbers count up from 0 (keeps `$`, `%`, decimals) |
| `fx-enter` | fade in, rising 16px, staggered per element |
| `fx-enter-down` / `-left` / `-right` | directional entrances |
| `fx-kenburns` | slow perpetual zoom drift (for images) |

## Code

Fenced code is highlighted (highlight.js, monokai). Add stepped line
highlights and offsets in brackets after the language:

````markdown
```js [1-2|4]
const a = 1;
const b = 2;

export default a + b; // highlighted on the second step
```
````

`[287: 2|4]` starts line numbering at 287.

## Presenting

The editor's **Present** button starts a fullscreen slideshow of the current
document — including unsaved edits. Navigate with the arrow keys (↓ enters
vertical stacks), press **S** for the speaker-notes window, and **Esc** (or
the ✕ button) to return to the editor. While you navigate the preview (or the
slideshow), the markdown pane highlights the active slide's source and scrolls
it into view, so you always know where to edit. The shareable read-only deck lives at
`/p/<id>/v#<key>` (press **F** there for fullscreen).

## PDF export

The editor's **Export to PDF** button opens the presenter with `?print-pdf`,
which lays every slide out as a page and opens the browser print dialog —
choose "Save as PDF". `showNotes: true` in the front matter includes speaker
notes. Charts render as static SVGs; fx are skipped.

## Caveats

- Don't start the document body with a bare `---` line (that's the front
  matter fence); begin with content.
- One `Note:` block per slide.
- A slide separator (`---`/`--`) force-closes any open `:::` containers.

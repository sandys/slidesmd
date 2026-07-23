// Seed document for new presentations — a working tour of the markdown
// dialect (front matter, separators, layouts, charts, fx, notes).
export const SEED_DOC = `---
theme: bento.css
transition: slide
footer: Made with slidesmd · {{page}}/{{total}}
slideNumber: c/t
---

<span class="kicker">slidesmd</span>

# Everything is markdown

Slides, themes, layouts and charts — all authored as text.

Note: Press S for speaker notes. This line only shows in the speaker view.

---

## Slides split on \`---\`

Vertical stacks use \`--\` on its own line — press ↓

- Fragments appear on click <!-- .element: class="fragment" -->
- Like this <!-- .element: class="fragment" -->

--

<!-- .slide: data-background-color="#1E2A3A" -->

### This is a vertical slide

Slide attributes (backgrounds, transitions) are set with
\`<!-- .slide: ... -->\` comments.

---

<!-- .slide: data-header="Per-slide headers work too" -->

## Layouts

::: cols

### Left

Write plain markdown inside layout containers.

:::split

### Right

> Start a container with \`::: cols\`, split with \`:::split\`, close with \`:::\` <!-- .element: class="quote" -->

:::

---

## Cards and KPIs

::: grid-3

::: card

**Zero-knowledge**

Content is encrypted in your browser.

:::

::: card

**Markdown-first**

No canvas editor — the text is the deck.

:::

::: tile-gradient card

**Portable**

Share one link; present anywhere.

:::

:::

---

## Numbers that count up

<p class="kpi fx-countup">12,400</p>

decks rendered <!-- .element: class="kpi-label" -->

---

## Charts from JSON

\`\`\`chart
{
  "preset": "bar",
  "height": 380,
  "xAxis": { "type": "category", "data": ["2023", "2024", "2025", "2026"] },
  "series": [{ "type": "bar", "name": "Decks", "data": [120, 480, 1400, 3200] }]
}
\`\`\`

---

<!-- .slide: data-auto-animate -->

## Morph ✨

---

<!-- .slide: data-auto-animate -->

## Morph ✨

### reveal auto-animate, from pure markdown

---

## Code, highlighted

\`\`\`js [1-2|4]
const deck = "markdown";
const magic = true;

export default deck + magic; // step two
\`\`\`

---

# Make it yours

Change the \`theme:\` line above, or pick one from the selector.
`;

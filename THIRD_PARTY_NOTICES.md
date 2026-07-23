# Third-party notices

## Vendored code

### bento (nyblnet/bento)

`src/vendor/bento/` contains code vendored from
[nyblnet/bento](https://github.com/nyblnet/bento), licensed under the MIT
License, Copyright (c) 2026 The Bento/Suite authors:

- `anim.ts` — bento's animation engine (unmodified)
- `charts.ts` — bento's charts-lite SVG chart engine (modified: the bento
  document model type is replaced by a minimal `ChartLike` shape)
- `palette.ts` — chart palette derivation ported from bento's `model.ts`

Additionally, `src/lib/fx.ts` ports the count-up and entrance-stagger logic
from bento's `present.ts` (re-keyed onto CSS classes), and `src/themes/bento.css`
is styled after bento's starter-deck aesthetic.

Each file retains its original SPDX header. The MIT license text is included
in bento's repository; the standard MIT terms (use, copy, modify, merge,
publish, distribute, sublicense, sell — provided the copyright and permission
notice are preserved) apply to these files.

## Embedded fonts

`src/themes/bento.css` embeds two typefaces as woff2 data URIs (latin
subsets, obtained via nyblnet/bento):

- **Fraunces** (Black, 900) — © Undercase Type.
  Licensed under the SIL Open Font License 1.1.
  https://fonts.google.com/specimen/Fraunces
- **Instrument Sans** (variable, 400–700) — © the Instrument Sans Project
  Authors. Licensed under the SIL Open Font License 1.1.
  https://fonts.google.com/specimen/Instrument+Sans

The SIL OFL 1.1 permits embedding and redistribution; the full license text
is available at https://openfontlicense.org.

## Runtime dependencies

reveal.js (MIT, © Hakim El Hattab) and the other npm dependencies keep their
own licenses; see `node_modules/<package>/LICENSE` and `package.json`.

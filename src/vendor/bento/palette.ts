// SPDX-License-Identifier: MIT
// Copyright (c) 2026 The Bento/Suite authors
// Ported from https://github.com/nyblnet/bento (slides/src/model.ts, chart
// palette section). Modified for slidesmd: the bento doc theme is replaced by
// the minimal PaletteTheme shape.
//
// New charts should wear the deck's colours, not a stock palette. A deck can
// declare an explicit chartPalette; otherwise we synthesise a harmonious set
// from the single accent (accent + a cool structural counterpart, each with a
// light and deep tint) so any deck gets on-brand charts out of the box.

export type PaletteTheme = { accent: string; chartPalette?: string[] }

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0; const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    throw new Error('invalid hex color')
  }
  return [h, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const mm = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  const to = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function deriveChartPalette(accent: string): string[] {
  let h: number, s: number, l: number
  try { [h, s, l] = hexToHsl(accent) } catch { return ['#5470c6', '#91cc75', '#fac858', '#ee6666'] }
  const coolH = h + 190
  return [
    accent,
    hslToHex(coolH, Math.max(20, s * 0.5), Math.min(56, Math.max(44, l))),        // cool counterpart
    hslToHex(h, s * 0.92, Math.min(84, l + 14)),                                  // accent light
    hslToHex(coolH, Math.max(16, s * 0.38), Math.min(74, l + 20)),               // cool light
    hslToHex(h, s, Math.max(28, l - 16)),                                         // accent deep
    hslToHex(coolH, Math.max(24, s * 0.55), Math.max(26, l - 6)),                // cool deep
  ]
}

export function chartColorsFor(theme: PaletteTheme): string[] {
  return theme.chartPalette?.length ? theme.chartPalette.slice() : deriveChartPalette(theme.accent)
}

/** Give a chart option the deck's palette unless it already sets explicit colours. */
export function applyChartPalette<T extends Record<string, unknown>>(option: T, theme: PaletteTheme): T {
  const cur = (option as { color?: unknown }).color
  if (!Array.isArray(cur) || cur.length === 0) (option as { color?: string[] }).color = chartColorsFor(theme)
  return option
}

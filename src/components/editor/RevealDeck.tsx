"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import Notes from "reveal.js/plugin/notes/notes.esm.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/plugin/highlight/monokai.css";
import "@/styles/slides-kit.css";
import {
  HORIZONTAL_SEPARATOR,
  VERTICAL_SEPARATOR,
  NOTES_SEPARATOR,
  processDoc,
  normalizeThemeFile,
  type DeckConfig,
} from "@/lib/markdown";
import { enhanceChartBlocks, mountLiveCharts } from "@/lib/chart-blocks";
import { runSlideFx } from "@/lib/fx";

export type DeckMode = "preview" | "view" | "present" | "slideshow";

interface RevealDeckProps {
  doc: string;
  themeFallback?: string | null;
  mode: DeckMode;
  onSlideChanged?: (indices: { h: number; v: number }) => void;
}

const PREVIEW_DEBOUNCE_MS = 300;

function buildRevealConfig(mode: DeckMode, config: DeckConfig, plugins: unknown[]) {
  const base: Record<string, unknown> =
    mode === "preview"
      ? { embedded: true, enableFocus: false }
      : mode === "view"
        ? { embedded: false }
        : mode === "slideshow"
          ? {
              // In-page fullscreen overlay: embedded so reveal scopes itself to
              // the overlay div, keyboardCondition null so arrow keys work
              // without the deck needing focus.
              embedded: true,
              keyboardCondition: null,
              hash: false,
              progress: true,
              center: true,
              controls: true,
              slideNumber: "c",
              transition: "slide",
            }
          : {
              hash: false,
              history: false,
              progress: true,
              center: true,
              controls: true,
              slideNumber: "c",
              pdfSeparateFragments: true,
              pdfMaxPagesPerSlide: 1,
              pdfPageHeightOffset: -1,
              transition: "slide",
            };

  const overrides: Record<string, unknown> = {};
  if (config.transition) overrides.transition = config.transition;
  if (config.transitionSpeed) overrides.transitionSpeed = config.transitionSpeed;
  if (config.backgroundTransition) overrides.backgroundTransition = config.backgroundTransition;
  if (config.slideNumber !== undefined) overrides.slideNumber = config.slideNumber;
  if (config.width) overrides.width = config.width;
  if (config.height) overrides.height = config.height;
  if (config.margin !== undefined) overrides.margin = config.margin;
  if (config.center !== undefined) overrides.center = config.center;
  if (config.showNotes !== undefined) overrides.showNotes = config.showNotes;

  const result: Record<string, unknown> = { ...base, ...overrides, plugins };
  if (config.animateLists !== undefined) {
    result.markdown = { animateLists: config.animateLists };
  }
  return result as Reveal.Options;
}

// The one deck renderer for every surface (editor preview, /v viewer,
// /present presenter+print). React owns only the host div: the reveal.js
// markdown plugin replaces the template section via outerHTML, so the deck
// subtree is built imperatively and torn down wholesale on every change.
export function RevealDeck({ doc, themeFallback, mode, onSlideChanged }: RevealDeckProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<Reveal.Api | null>(null);
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);
  const lastIndicesRef = useRef<{ h: number; v: number } | null>(null);
  const printedRef = useRef(false);
  const [isPrint, setIsPrint] = useState(false);

  // Latest callback in a ref so the deck effect never re-runs on identity churn.
  const onSlideChangedRef = useRef(onSlideChanged);
  useEffect(() => {
    onSlideChangedRef.current = onSlideChanged;
  }, [onSlideChanged]);

  useEffect(() => {
    setIsPrint(mode === "present" && /print-pdf/i.test(window.location.search));
  }, [mode]);

  // Debounce edits in preview mode so per-keystroke changes don't rebuild the deck.
  const [deferredDoc, setDeferredDoc] = useState(doc);
  useEffect(() => {
    if (mode !== "preview") {
      setDeferredDoc(doc);
      return;
    }
    const timer = setTimeout(() => setDeferredDoc(doc), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [doc, mode]);

  const { config, markdown } = useMemo(() => processDoc(deferredDoc), [deferredDoc]);

  const themeFile = config.theme
    ? normalizeThemeFile(config.theme)
    : normalizeThemeFile(themeFallback || "black.css");

  // Theme stylesheet: a swappable <link> so front matter edits retheme live.
  useEffect(() => {
    if (!themeLinkRef.current) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      document.head.appendChild(link);
      themeLinkRef.current = link;
    }
    const linkEl = themeLinkRef.current;
    linkEl.onload = () => deckRef.current?.layout();
    linkEl.href = `/themes/${themeFile}`;

    return () => {
      if (themeLinkRef.current) {
        themeLinkRef.current.onload = null;
        themeLinkRef.current.remove();
        themeLinkRef.current = null;
      }
    };
  }, [themeFile]);

  // Build + initialize the deck; rebuild whenever the processed doc changes.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let disposeSlideFx: (() => void) | null = null;

    const slidesEl = document.createElement("div");
    slidesEl.className = "slides";
    const section = document.createElement("section");
    // Nothing but data-markdown + separators here: the plugin forwards any
    // other attribute on the template section to every generated slide.
    section.setAttribute("data-markdown", "");
    section.setAttribute("data-separator", HORIZONTAL_SEPARATOR);
    section.setAttribute("data-separator-vertical", VERTICAL_SEPARATOR);
    section.setAttribute("data-separator-notes", NOTES_SEPARATOR);
    const template = document.createElement("script");
    template.type = "text/template";
    template.textContent = markdown;
    section.appendChild(template);
    slidesEl.appendChild(section);
    host.appendChild(slidesEl);

    (async () => {
      // highlight.esm.js touches window at import time — must load lazily.
      const { default: Highlight } = await import(
        "reveal.js/plugin/highlight/highlight.esm.js"
      );
      if (disposed) return;

      const deck = new Reveal(host, buildRevealConfig(mode, config, [Markdown, Highlight, Notes]));
      await deck.initialize();
      if (disposed) {
        try {
          deck.destroy();
        } catch {
          /* already torn down */
        }
        return;
      }
      deckRef.current = deck;
      deck.sync();

      if (mode === "preview" && lastIndicesRef.current) {
        const { h, v } = lastIndicesRef.current;
        deck.slide(h, v);
      }

      const notifySlideChanged = () => {
        const { h, v } = deck.getIndices();
        onSlideChangedRef.current?.({ h, v });
      };
      deck.on("slidechanged", notifySlideChanged);
      notifySlideChanged();

      const printing = mode === "present" && /print-pdf/i.test(window.location.search);
      const accent =
        config.accent ?? getComputedStyle(host).getPropertyValue("--r-link-color").trim();
      enhanceChartBlocks(host, accent);

      if (mode !== "preview" && !printing) {
        const runForCurrentSlide = () => {
          disposeSlideFx?.();
          const current = deck.getCurrentSlide();
          if (current instanceof HTMLElement) {
            const stopFx = runSlideFx(current);
            const stopCharts = mountLiveCharts(current);
            disposeSlideFx = () => {
              stopFx();
              stopCharts();
            };
          }
        };
        deck.on("slidechanged", runForCurrentSlide);
        runForCurrentSlide();
      }

      if (printing) {
        deck.on("pdf-ready", () => {
          enhanceChartBlocks(host, accent); // print clones fragments — idempotent re-pass
          if (!printedRef.current) {
            printedRef.current = true;
            setTimeout(() => window.print(), 300);
          }
        });
      }
    })().catch((err) => console.error("Reveal init error", err));

    return () => {
      disposed = true;
      disposeSlideFx?.();
      if (deckRef.current) {
        try {
          lastIndicesRef.current = deckRef.current.getIndices();
        } catch {
          /* deck already gone */
        }
        try {
          deckRef.current.destroy();
        } catch (e) {
          console.warn("Reveal.js destroy failed", e);
        }
        deckRef.current = null;
      }
      host.replaceChildren();
    };
  }, [markdown, config, mode]);

  // Keep embedded decks (preview pane, slideshow overlay) scaled to their box.
  useEffect(() => {
    if ((mode !== "preview" && mode !== "slideshow") || typeof ResizeObserver === "undefined") return;
    const el = hostRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => deckRef.current?.layout());
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  return (
    <>
      {isPrint && (
        <div className="print:hidden fixed top-2 left-1/2 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-sm text-white">
          If the print dialog didn&apos;t open, press Ctrl/Cmd+P and save as PDF.
        </div>
      )}
      <div ref={hostRef} className="reveal h-full w-full" />
    </>
  );
}

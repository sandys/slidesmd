"use client";

import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import "reveal.js/dist/reveal.css";
// Note: Theme CSS is loaded dynamically so previews match the selector

interface RevealPreviewProps {
  markdown: string;
  theme: string;
}

export function RevealPreview({ markdown, theme }: RevealPreviewProps) {
  const deckRef = useRef<Reveal.Api | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);

  // Load or update the selected theme
  useEffect(() => {
    if (!themeLinkRef.current) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      document.head.appendChild(link);
      themeLinkRef.current = link;
    }

    const themeUrl = `/themes/${theme}`;
    const linkEl = themeLinkRef.current;
    linkEl.onload = () => deckRef.current?.layout();
    linkEl.href = themeUrl;

    return () => {
      if (themeLinkRef.current) {
        themeLinkRef.current.onload = null;
        themeLinkRef.current.remove();
        themeLinkRef.current = null;
      }
    };
  }, [theme]);

  // Reinitialize reveal whenever the markdown changes
  useEffect(() => {
    const container = revealRef.current;
    if (!container) return;

    if (deckRef.current) {
      try {
        deckRef.current.destroy();
      } catch (e) {
        console.warn("Reveal.js destroy failed", e);
      }
      deckRef.current = null;
    }

    const deck = new Reveal(container, {
      embedded: true,
      plugins: [Markdown],
      enableFocus: false,
    });

    void deck.initialize().then(() => {
      deckRef.current = deck;
      deck.sync();
      void deck.slide(0, 0);
    });

    return () => {
      if (deckRef.current) {
        try {
          deckRef.current.destroy();
        } catch (e) {
          console.warn("Reveal.js destroy failed", e);
        }
        deckRef.current = null;
      }
    };
  }, [markdown]);

  // Resize slides when the container size changes
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = revealRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => deckRef.current?.layout());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={revealRef} className="reveal h-full w-full">
      <div className="slides">
        <section
          data-markdown=""
          data-separator="^\\n---\\n$"
          data-separator-vertical="^\\n--\\n$"
        >
          <script
            type="text/template"
            dangerouslySetInnerHTML={{ __html: markdown }}
          ></script>
        </section>
      </div>
    </div>
  );
}

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

  // Initialize reveal once and re-sync when markdown changes
  useEffect(() => {
    if (!revealRef.current) return;

    if (!deckRef.current) {
      const deck = new Reveal(revealRef.current, {
        embedded: true,
        plugins: [Markdown],
        enableFocus: false,
      });

      void deck.initialize().then(() => {
        deckRef.current = deck;
        deck.sync();
        void deck.slide(0, 0);
      });
    } else {
      deckRef.current.sync();
      void deckRef.current.slide(0, 0);
    }

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

  return (
    <div ref={revealRef} className="reveal h-full w-full">
      <div className="slides">
        <section data-markdown>
          <script
            type="text/template"
            dangerouslySetInnerHTML={{ __html: markdown }}
          />
        </section>
      </div>
    </div>
  );
}

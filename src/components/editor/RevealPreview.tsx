"use client";

import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown";
import "reveal.js/dist/reveal.css";
// Note: The theme CSS is now loaded dynamically below

interface RevealPreviewProps {
  markdown: string;
  theme: string;
}

export function RevealPreview({ markdown, theme }: RevealPreviewProps) {
  const deckRef = useRef<Reveal.Api | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);

  // Effect for theme switching
  useEffect(() => {
    if (!themeLinkRef.current) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      document.head.appendChild(link);
      themeLinkRef.current = link;
    }
    themeLinkRef.current.href = `/themes/${theme}`;

    return () => {
      // On component unmount, remove the theme link
      if (themeLinkRef.current) {
        themeLinkRef.current.remove();
        themeLinkRef.current = null;
      }
    };
  }, [theme]);

  // Effect for one-time initialization
  useEffect(() => {
    if (deckRef.current || !containerRef.current) return;

    const deck = new Reveal(containerRef.current, {
      embedded: true,
      plugins: [Markdown],
      enableFocus: false,
    });

    void deck.initialize().then(() => {
      deckRef.current = deck;
      updateSlides(deck, markdown);
    });

    return () => {
      try {
        if (deckRef.current) {
          (deckRef.current as Reveal.Api).destroy();
          deckRef.current = null;
        }
      } catch (e) {
        console.warn("Reveal.js destroy call failed.", e);
      }
    };
  }, [markdown]); // Runs only once

  // Effect for updating slides when markdown changes
  useEffect(() => {
    if (deckRef.current) {
      updateSlides(deckRef.current, markdown);
    }
  }, [markdown]);

  const updateSlides = (deck: Reveal.Api, newMarkdown: string) => {
    const slidesContainer = deck.getSlidesElement();
    if (slidesContainer) {
      slidesContainer.innerHTML = `
        <section data-markdown>
          <textarea data-template readonly>
            ${newMarkdown}
          </textarea>
        </section>
      `;
      deck.sync();
      void deck.slide(0, 0);
    }
  };

  return (
    <div className="reveal h-full w-full" ref={containerRef}>
      <div className="slides"></div>
    </div>
  );
}

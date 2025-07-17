"use client";

import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";

interface RevealPreviewProps {
  markdown: string;
}

export function RevealPreview({ markdown }: RevealPreviewProps) {
  const deckRef = useRef<Reveal.Api | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect for one-time initialization
  useEffect(() => {
    if (deckRef.current || !containerRef.current) return;

    const deck = new Reveal(containerRef.current, {
      embedded: true,
      plugins: [Markdown],
    });

    deck.initialize().then(() => {
      deckRef.current = deck;
      // Initial content load
      updateSlides(deck, markdown);
    });

    return () => {
      try {
        if (deckRef.current) {
          deckRef.current.destroy();
          deckRef.current = null;
        }
      } catch (e) {
        console.warn("Reveal.js destroy call failed.", e);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Effect for updating slides when markdown changes
  useEffect(() => {
    if (deckRef.current) {
      updateSlides(deckRef.current, markdown);
    }
  }, [markdown]);

  const updateSlides = (deck: Reveal.Api, newMarkdown: string) => {
    // This is the correct API to update the slides
    const slidesContainer = deck.getSlidesElement();
    if (slidesContainer) {
      slidesContainer.innerHTML = `
        <section data-markdown>
          <textarea data-template>
            ${newMarkdown}
          </textarea>
        </section>
      `;
      // After setting the content, we need to tell Reveal.js to re-sync
      deck.sync();
      deck.slide(0, 0); // Optional: reset to the first slide on update
    }
  };

  return (
    <div className="reveal h-full w-full" ref={containerRef}>
      {/* The slides div will be populated by Reveal.js */}
      <div className="slides"></div>
    </div>
  );
}
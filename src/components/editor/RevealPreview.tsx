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
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<Reveal.Api | null>(null);

  useEffect(() => {
    if (deckRef.current || !containerRef.current) return;

    const deck = new Reveal(containerRef.current, {
      embedded: true,
      plugins: [Markdown],
      // Pass the markdown content directly to the configuration
      markdown: {
        content: markdown,
      },
    });

    deck.initialize().then(() => {
      deckRef.current = deck;
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
  }, []); // Run only once on mount

  // Update the slides when markdown changes
  useEffect(() => {
    if (deckRef.current) {
      // This is a more robust way to update the content
      // It re-parses the markdown and updates the slides.
      deckRef.current.getPlugin("markdown").marked(markdown).then((slides: string) => {
        const slidesContainer = deckRef.current?.getSlidesElement();
        if (slidesContainer) {
            slidesContainer.innerHTML = slides;
            deckRef.current?.sync();
            deckRef.current?.slide(0, 0); // Reset to the first slide
        }
      });
    }
  }, [markdown]);

  return (
    <div className="reveal h-full w-full" ref={containerRef}>
      {/* The slides div will be populated by Reveal.js */}
      <div className="slides"></div>
    </div>
  );
}
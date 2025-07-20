// src/components/editor/PrintView2.tsx
"use client";

import { useEffect, useRef } from "react";
import type { getPresentation } from "@/app/actions";

// Import base reveal.js styles
import "reveal.js/dist/reveal.css";

import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";

type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;

interface PrintView2Props {
  presentation: Presentation;
}

// By declaring the deck instance outside the component, we ensure it's a singleton
// that will not be affected by React's re-renders or StrictMode's double-effect invocation.
// This is the correct pattern you provided.
let deck: Reveal.Api | null = null;

export function PrintView2({ presentation }: PrintView2Props) {
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);

  // Effect 1: Load theme
  useEffect(() => {
    if (!themeLinkRef.current) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      document.head.appendChild(link);
      themeLinkRef.current = link;
    }
    const themeUrl = `/api/themes/${presentation.theme || 'black.css'}`;
    console.log("Setting theme URL to:", themeUrl);
    themeLinkRef.current.href = themeUrl;

    return () => {
      if (themeLinkRef.current) {
        document.head.removeChild(themeLinkRef.current);
      }
    };
  }, [presentation.theme]);

  // Effect 2: Initialize Reveal.js
  useEffect(() => {
    // Only initialize if the deck hasn't been created yet.
    if (!deck && revealRef.current) {
      console.log("PrintView2: Initializing Reveal.js for the first and only time.");
      deck = new Reveal(revealRef.current, {
        embedded: true,
        plugins: [Markdown],
        view: 'print',
      });

      deck.initialize().then(() => {
        console.log("PrintView2: Reveal.js initialized successfully.");
      });
    }

    // The cleanup function will be called when the component *finally* unmounts.
    return () => {
      if (deck) {
        console.log("PrintView2: Cleaning up and destroying Reveal.js instance.");
        try {
          deck.destroy();
        } catch (e) {
          console.error("PrintView2: Error during Reveal.js destroy:", e);
        }
        // Reset the singleton instance so it can be re-initialized if the page is ever revisited.
        deck = null;
      }
    };
  }, []);

  return (
    <div ref={revealRef} className="reveal">
      <div className="slides">
        {presentation.slides.map((slide) => (
          <section key={slide.id} data-markdown="">
            <script type="text/template">{slide.content}</script>
          </section>
        ))}
      </div>
    </div>
  );
}
// src/components/editor/PrintView2.tsx
"use client";

import { useEffect, useRef } from "react";
import type { getPresentation } from "@/app/actions";

// Import base reveal.js styles
import "reveal.js/dist/reveal.css";

import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import Notes from "reveal.js/plugin/notes/notes.esm.js";

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
    const themeUrl = `/themes/${presentation.theme || "black.css"}`;
    console.log("Loading theme", themeUrl);
    themeLinkRef.current.href = themeUrl;

    return () => {
      if (themeLinkRef.current) {
        document.head.removeChild(themeLinkRef.current);
        // Reset the ref so the link will be recreated on the
        // second mount that occurs in React Strict Mode.
        themeLinkRef.current = null;
      }
    };
  }, [presentation.theme]);

  // Effect 2: Initialize Reveal.js
  useEffect(() => {
    // Only initialize if the deck hasn't been created yet.
    if (!deck && revealRef.current) {
      (async () => {
        const { default: Highlight } = await import(
          "reveal.js/plugin/highlight/highlight.esm.js"
        );
        console.log("Initializing Reveal at", window.location.href);
        deck = new Reveal(revealRef.current!, {
          hash: false,
          // Use Reveal's default slide dimensions to avoid overly small text
          // when the deck scales slides to fit the viewport.
          progress: true,
          history: false,
          center: true,
          controls: true,
          slideNumber: "c",
          pdfSeparateFragments: true,
          pdfMaxPagesPerSlide: 1,
          pdfPageHeightOffset: -1,
          transition: "slide",
          plugins: [Markdown, Highlight, Notes],
        });
        await deck.initialize();
        deck.sync();
        console.log("Reveal initialized with", deck.getTotalSlides(), "slides");
        console.log("Reveal config view", deck.getConfig().view);
        if (revealRef.current) {
          console.log("Reveal HTML after init", revealRef.current.outerHTML);
          setTimeout(() => {
            console.log(
              "Reveal HTML after sync",
              revealRef.current?.outerHTML
            );
          }, 500);
        }
      })().catch((err) => console.error("Reveal init error", err));
    }

    // The cleanup function will be called when the component *finally* unmounts.
    return () => {
      if (deck) {
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

  const allSlides = presentation.slides.map((s) => s.content).join("\n---\n");
  console.log("All slide markdown", allSlides);

  return (
    <div ref={revealRef} className="reveal">
      <div className="slides">
        <section
          data-markdown=""
          data-separator="^\\n---\\n$"
          data-separator-vertical="^\\n--\\n$"
        >
          <script
            type="text/template"
            dangerouslySetInnerHTML={{ __html: allSlides }}
          ></script>
        </section>
      </div>
    </div>
  );
}

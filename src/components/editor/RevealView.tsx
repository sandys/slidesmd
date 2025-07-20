"use client";

import { useEffect, useRef } from "react";
import type { getPresentation } from "@/app/actions";
import Reveal from "reveal.js";
import Markdown from "reveal.js/plugin/markdown/markdown.esm.js";
import "reveal.js/dist/reveal.css";

export type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;

interface RevealViewProps {
  presentation: Presentation;
}

let deck: Reveal.Api | null = null;

export function RevealView({ presentation }: RevealViewProps) {
  const themeLinkRef = useRef<HTMLLinkElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!themeLinkRef.current) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      document.head.appendChild(link);
      themeLinkRef.current = link;
    }
    const themeUrl = `/api/themes/${presentation.theme || "black.css"}`;
    themeLinkRef.current.href = themeUrl;

    return () => {
      if (themeLinkRef.current) {
        document.head.removeChild(themeLinkRef.current);
      }
    };
  }, [presentation.theme]);

  useEffect(() => {
    if (!deck && revealRef.current) {
      deck = new Reveal(revealRef.current, {
        embedded: false,
        plugins: [Markdown],
      });
      void deck.initialize();
    }

    return () => {
      if (deck) {
        try {
          deck.destroy();
        } catch (e) {
          console.error("Reveal destroy error", e);
        }
        deck = null;
      }
    };
  }, []);

  return (
    <div ref={revealRef} className="reveal h-full w-full">
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


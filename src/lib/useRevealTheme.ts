"use client";

import { useEffect } from "react";

/**
 * Ensures the Reveal.js theme stylesheet is loaded once per page.
 * Subsequent calls with a different theme update the href on the
 * same <link> element. The link is removed only if this hook
 * created it.
 */
export function useRevealTheme(theme: string) {
  useEffect(() => {
    const id = "reveal-theme";
    let link = document.head.querySelector<HTMLLinkElement>(`link#${id}`);
    const created = !link;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = `/api/themes/${theme}`;

    return () => {
      if (created && link) {
        link.remove();
      }
    };
  }, [theme]);
}


"use client";

import { useEffect, useState } from "react";
import type { getPresentation } from "@/app/actions";
import { decrypt, importKey } from "@/lib/crypto";
import { RevealView } from "./RevealView";

export type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;

interface ViewWrapperProps {
  presentation: Presentation;
}

export function ViewWrapper({ presentation }: ViewWrapperProps) {
  const [decryptedSlides, setDecryptedSlides] = useState<Presentation["slides"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const decryptSlides = async () => {
      try {
        const keyString = window.location.hash.substring(1);
        if (!keyString) {
          setError("No decryption key found in URL.");
          return;
        }

        const key = await importKey(keyString);
        const slides = await Promise.all(
          presentation.slides.map(async (slide) => ({
            ...slide,
            content: await decrypt(slide.content, key),
          }))
        );
        setDecryptedSlides(slides);
      } catch (e) {
        console.error("Failed to decrypt presentation:", e);
        setError("Failed to decrypt slides. The key may be invalid or the content may be corrupt.");
      }
    };

    void decryptSlides();
  }, [presentation]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!decryptedSlides) {
    return <div className="p-4">Decrypting presentation...</div>;
  }

  const decryptedPresentation = { ...presentation, slides: decryptedSlides };

  return <RevealView presentation={decryptedPresentation} />;
}


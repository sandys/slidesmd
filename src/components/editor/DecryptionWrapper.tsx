// src/components/editor/DecryptionWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { decrypt, importKey } from "@/lib/crypto";
import { PresentationEditor } from "./PresentationEditor";
import type { getPresentation } from "@/app/actions";

type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;

interface DecryptionWrapperProps {
  presentation: Presentation;
  editKeyFromUrl?: string;
}

export function DecryptionWrapper({ presentation, editKeyFromUrl }: DecryptionWrapperProps) {
  const [decryptedSlides, setDecryptedSlides] = useState<Presentation["slides"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const decryptSlides = async () => {
      try {
        const keyString = window.location.hash.substring(1);
        if (!keyString) {
          setError("No decryption key found in URL. Please use a link with a key.");
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
        console.error(e);
        setError("Failed to decrypt presentation. The key may be invalid or the data corrupted.");
      }
    };

    decryptSlides();
  }, [presentation]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!decryptedSlides) {
    return <div className="p-4">Decrypting...</div>;
  }

  const decryptedPresentation = { ...presentation, slides: decryptedSlides };

  return (
    <PresentationEditor
      presentation={decryptedPresentation}
      editKeyFromUrl={editKeyFromUrl}
    />
  );
}

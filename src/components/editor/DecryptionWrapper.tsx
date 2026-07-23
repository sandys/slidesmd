// src/components/editor/DecryptionWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { decrypt, importKey } from "@/lib/crypto";
import { joinLegacySlides } from "@/lib/markdown";
import { PresentationEditor } from "./PresentationEditor";
import { RevealDeck } from "./RevealDeck";
import type { getPresentation } from "@/app/actions";

type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;

export type DecryptionMode = "edit" | "view" | "present";

interface DecryptionWrapperProps {
  presentation: Presentation;
  mode: DecryptionMode;
  editKeyFromUrl?: string;
}

// The one decrypt gate for every surface. Decrypts all slide rows client-side
// (the key never leaves the URL fragment) and joins legacy multi-row decks
// into the single markdown document model; a deck collapses to one row on its
// next save.
export function DecryptionWrapper({ presentation, mode, editKeyFromUrl }: DecryptionWrapperProps) {
  const [doc, setDoc] = useState<string | null>(null);
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
        const contents = await Promise.all(
          presentation.slides.map(async (slide) => {
            const decryptedContent = await decrypt(slide.content, key);
            if (decryptedContent === null || decryptedContent === undefined || decryptedContent === "") {
              throw new Error(`Failed to decrypt slide #${slide.id}. Content is empty.`);
            }
            return decryptedContent;
          })
        );
        setDoc(joinLegacySlides(contents));
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during decryption.";
        setError(`Failed to decrypt presentation. The key may be invalid or the data corrupted. Details: ${errorMessage}`);
      }
    };

    void (async () => {
      await decryptSlides();
    })();
  }, [presentation]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (doc === null) {
    return <div className="p-4">Decrypting...</div>;
  }

  if (mode === "edit") {
    return (
      <PresentationEditor
        presentation={presentation}
        doc={doc}
        primarySlideId={presentation.slides[0]?.id}
        editKeyFromUrl={editKeyFromUrl}
      />
    );
  }

  return (
    <div className="h-screen w-screen">
      <RevealDeck doc={doc} themeFallback={presentation.theme} mode={mode} />
    </div>
  );
}

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
      console.log("[DecryptionWrapper] Starting decryption process...");
      console.log("[DecryptionWrapper] Received presentation:", presentation);

      try {
        const keyString = window.location.hash.substring(1);
        console.log("[DecryptionWrapper] Extracted key string from URL hash:", keyString);
        if (!keyString) {
          console.error("[DecryptionWrapper] No decryption key found in URL.");
          setError("No decryption key found in URL. Please use a link with a key.");
          return;
        }

        console.log("[DecryptionWrapper] Importing key...");
        const key = await importKey(keyString);
        console.log("[DecryptionWrapper] Key imported successfully.");

        console.log("[DecryptionWrapper] Decrypting slides...");
        const slides = await Promise.all(
          presentation.slides.map(async (slide, index) => {
            console.log(`[DecryptionWrapper] Decrypting slide #${index + 1} (ID: ${slide.id})`);
            console.log(`[DecryptionWrapper] Encrypted content for slide #${index + 1}:`, slide.content);
            const decryptedContent = await decrypt(slide.content, key);
            console.log(`[DecryptionWrapper] Decrypted content for slide #${index + 1}:`, decryptedContent);
            
            if (decryptedContent === null || decryptedContent === undefined || decryptedContent === "") {
              console.error(`[DecryptionWrapper] Failed to decrypt slide #${index + 1}. Decrypted content is empty or null.`);
              throw new Error(`Failed to decrypt slide #${slide.id}. Content is empty.`);
            }
            return {
              ...slide,
              content: decryptedContent,
            };
          })
        );
        console.log("[DecryptionWrapper] All slides decrypted successfully:", slides);
        setDecryptedSlides(slides);
      } catch (e) {
        console.error("[DecryptionWrapper] An error occurred during decryption:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setError(`Failed to decrypt presentation. The key may be invalid or the data corrupted. Details: ${errorMessage}`);
      }
    };

    decryptSlides();
  }, [presentation]);

  if (error) {
    console.error("[DecryptionWrapper] Rendering error message:", error);
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!decryptedSlides) {
    console.log("[DecryptionWrapper] Rendering 'Decrypting...' message.");
    return <div className="p-4">Decrypting...</div>;
  }

  console.log("[DecryptionWrapper] Rendering PresentationEditor with decrypted slides:", decryptedSlides);
  const decryptedPresentation = { ...presentation, slides: decryptedSlides };

  return (
    <PresentationEditor
      presentation={decryptedPresentation}
      editKeyFromUrl={editKeyFromUrl}
    />
  );
}

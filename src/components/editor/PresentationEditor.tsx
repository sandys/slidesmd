"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getPresentation, updatePresentation } from "@/app/actions";
import { SlideEditor } from "./SlideEditor";
import { encrypt, importKey } from "@/lib/crypto";
import { ShareDialog } from "./ShareDialog";

type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;
// This now represents a decrypted slide
type Slide = {
    id?: number;
    content: string;
    order: number;
    presentationId: number;
};

interface PresentationEditorProps {
  presentation: Omit<Presentation, 'slides'> & { slides: Slide[] };
  editKeyFromUrl?: string;
}

export function PresentationEditor({
  presentation,
  editKeyFromUrl,
}: PresentationEditorProps) {
  console.log("[PresentationEditor] Received presentation:", presentation);
  const [slides, setSlides] = useState<Slide[]>(presentation.slides);
  const [isSaving, startSaveTransition] = useTransition();
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);

  const hasEditAccess = !!editKeyFromUrl;
  console.log("[PresentationEditor] Edit access:", hasEditAccess);

  const handleSlideChange = (index: number, content: string) => {
    console.log(`[PresentationEditor] Slide #${index + 1} content changed:`, content);
    const newSlides = [...slides];
    newSlides[index].content = content;
    setSlides(newSlides);
  };

  const handleAddSlide = () => {
    console.log("[PresentationEditor] Adding new slide...");
    const newSlides = [
      ...slides,
      {
        id: Math.random(), // Temporary ID
        content: "## New Slide",
        order: slides.length + 1,
        presentationId: presentation.id,
      },
    ];
    setSlides(newSlides);
    console.log("[PresentationEditor] New slides state:", newSlides);
  };

  const handleSaveChanges = () => {
    console.log("[PresentationEditor] Starting save process...");
    startSaveTransition(async () => {
      try {
        const keyString = window.location.hash.substring(1);
        console.log("[PresentationEditor] Extracted key string for encryption:", keyString);
        if (!keyString || !editKeyFromUrl) {
            const errorMsg = "Cannot save. Decryption key or edit key is missing.";
            console.error(`[PresentationEditor] ${errorMsg}`);
            alert(errorMsg);
            return;
        }
        console.log("[PresentationEditor] Importing key for encryption...");
        const key = await importKey(keyString);
        console.log("[PresentationEditor] Key imported successfully.");

        console.log("[PresentationEditor] Encrypting slides for saving...");
        const encryptedSlides = await Promise.all(
            slides.map(async (slide, index) => {
                console.log(`[PresentationEditor] Encrypting slide #${index + 1}:`, slide.content);
                const encryptedContent = await encrypt(slide.content, key);
                console.log(`[PresentationEditor] Encrypted content for slide #${index + 1}:`, encryptedContent);
                return {
                    id: slide.id,
                    order: slide.order,
                    content: encryptedContent,
                };
            })
        );
        console.log("[PresentationEditor] All slides encrypted:", encryptedSlides);

        console.log("[PresentationEditor] Calling updatePresentation action...");
        await updatePresentation(presentation.publicId, editKeyFromUrl, encryptedSlides);
        console.log("[PresentationEditor] updatePresentation action completed.");
        alert("Presentation saved!");
      } catch (error) {
        const errorMsg = `Error saving: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`[PresentationEditor] ${errorMsg}`, error);
        alert(errorMsg);
      }
    });
  };

  console.log("[PresentationEditor] Rendering with slides:", slides);

  return (
    <div className="p-4 space-y-4">
      {slides.map((slide, index) => (
        <SlideEditor
          key={slide.id}
          content={slide.content}
          onContentChange={(newContent) => handleSlideChange(index, newContent)}
        />
      ))}
      <div className="flex space-x-2">
        <Button onClick={handleAddSlide} disabled={!hasEditAccess}>Add New Slide</Button>
        <Button onClick={handleSaveChanges} disabled={isSaving || !hasEditAccess}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="secondary" onClick={() => setShareDialogOpen(true)}>Share</Button>
      </div>
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        publicId={presentation.publicId}
        editKey={editKeyFromUrl}
      />
    </div>
  );
}

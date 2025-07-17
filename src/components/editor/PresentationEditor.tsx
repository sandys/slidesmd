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
  const [slides, setSlides] = useState<Slide[]>(presentation.slides);
  const [isSaving, startSaveTransition] = useTransition();
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);

  const hasEditAccess = !!editKeyFromUrl;

  const handleSlideChange = (index: number, content: string) => {
    const newSlides = [...slides];
    newSlides[index].content = content;
    setSlides(newSlides);
  };

  const handleAddSlide = () => {
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
  };

  const handleSaveChanges = () => {
    startSaveTransition(async () => {
      try {
        const keyString = window.location.hash.substring(1);
        if (!keyString || !editKeyFromUrl) {
            alert("Cannot save. Decryption key or edit key is missing.");
            return;
        }
        const key = await importKey(keyString);

        const encryptedSlides = await Promise.all(
            slides.map(async (slide) => ({
                id: slide.id,
                order: slide.order,
                encryptedContent: await encrypt(slide.content, key),
            }))
        );

        await updatePresentation(presentation.publicId, editKeyFromUrl, encryptedSlides);
        alert("Presentation saved!");
      } catch (error) {
        alert(`Error saving: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });
  };

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

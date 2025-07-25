"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getPresentation, updatePresentation } from "@/app/actions";
import { SlideEditor } from "./SlideEditor";
import { encrypt, importKey } from "@/lib/crypto";
import { ShareDialog } from "./ShareDialog";
import { ThemeSelector } from "./ThemeSelector";

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
  const [theme, setTheme] = useState(presentation.theme);
  const [isSaving, startSaveTransition] = useTransition();
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

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
      setStatus(null);
      try {
        const keyString = window.location.hash.substring(1);
        if (!keyString || !editKeyFromUrl) {
            setStatus("Cannot save. Decryption key or edit key is missing.");
            setStatusType("error");
            return;
        }
        const key = await importKey(keyString);

        const encryptedSlides = await Promise.all(
            slides.map(async (slide) => ({
                id: slide.id,
                order: slide.order,
                content: await encrypt(slide.content, key),
            }))
        );

        await updatePresentation(
          presentation.publicId,
          editKeyFromUrl,
          encryptedSlides,
          theme
        );
        setStatus("Presentation saved!");
        setStatusType("success");
      } catch (error) {
        setStatus(
          `Error saving: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        setStatusType("error");
      }
    });
  };

  const handlePrint = () => {
    const key = window.location.hash;
    // Open a dedicated print page, passing the key in the hash.
    const printUrl = `/present/p/${presentation.publicId}/h${key}`;
    window.open(printUrl, '_blank');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold mr-4">Edit Presentation</h2>
          <Button onClick={handleAddSlide} disabled={!hasEditAccess}>
            Add New Slide
          </Button>
          <Button
            onClick={handleSaveChanges}
            disabled={isSaving || !hasEditAccess}
            className="gap-2"
          >
            {isSaving && <Spinner />}
            Save Changes
          </Button>
          {status && (
            <span
              className={cn(
                "text-sm",
                statusType === "error" ? "text-red-600" : "text-green-600"
              )}
            >
              {status}
            </span>
          )}
          <Button variant="secondary" onClick={() => setShareDialogOpen(true)}>
            Share
          </Button>
          <Button variant="outline" onClick={handlePrint}>Export to PDF</Button>
        </div>
        <div className="w-48">
          <ThemeSelector selectedTheme={theme} onThemeChange={setTheme} />
        </div>
      </div>

      {slides.map((slide, index) => (
        <SlideEditor
          key={slide.id}
          content={slide.content}
          onContentChange={(newContent) => handleSlideChange(index, newContent)}
          theme={theme}
          editable={hasEditAccess}
        />
      ))}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        publicId={presentation.publicId}
        editKey={editKeyFromUrl}
      />
    </div>
  );
}

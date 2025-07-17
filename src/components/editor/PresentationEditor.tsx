"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPresentation, updatePresentation } from "@/app/actions";
import { SlideEditor } from "./SlideEditor";

type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;
type Slide = Presentation["slides"][number];

interface PresentationEditorProps {
  presentation: Presentation;
  editKeyFromUrl?: string;
}

export function PresentationEditor({
  presentation,
  editKeyFromUrl,
}: PresentationEditorProps) {
  const [slides, setSlides] = useState<Slide[]>(presentation.slides);
  const [editKey, setEditKey] = useState(editKeyFromUrl || "");
  const [hasEditAccess, setHasEditAccess] = useState(!!editKeyFromUrl);
  const [isPending, startTransition] = useTransition();

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
    startTransition(async () => {
      try {
        await updatePresentation(presentation.publicId, editKey, slides);
        alert("Presentation saved!");
      } catch (error) {
        alert(`Error saving: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });
  };

  if (!hasEditAccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold">Enter Edit Key</h1>
          <Input
            type="password"
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            placeholder="Your edit key"
          />
          <Button onClick={() => setHasEditAccess(true)}>Edit</Button>
        </div>
      </main>
    );
  }

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
        <Button onClick={handleAddSlide}>Add New Slide</Button>
        <Button onClick={handleSaveChanges} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

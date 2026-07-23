"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { getPresentation, updatePresentation } from "@/app/actions";
import { encrypt, importKey } from "@/lib/crypto";
import {
  parseFrontMatter,
  setFrontMatterValue,
  normalizeThemeFile,
  slideRangeForIndices,
} from "@/lib/markdown";
import { MarkdownPane } from "./MarkdownPane";
import { RevealDeck } from "./RevealDeck";
import { ShareDialog } from "./ShareDialog";
import { ThemeSelector } from "./ThemeSelector";

type Presentation = NonNullable<Awaited<ReturnType<typeof getPresentation>>>;

interface PresentationEditorProps {
  presentation: Presentation;
  doc: string;
  primarySlideId?: number;
  editKeyFromUrl?: string;
}

// Single-document editor: the whole deck is one markdown document (--- splits
// slides, -- vertical, front matter for deck config), edited in one pane with
// a live whole-deck preview beside it.
export function PresentationEditor({
  presentation,
  doc: initialDoc,
  primarySlideId,
  editKeyFromUrl,
}: PresentationEditorProps) {
  const [doc, setDoc] = useState(initialDoc);
  const [isSaving, startSaveTransition] = useTransition();
  const [isShareDialogOpen, setShareDialogOpen] = useState(false);
  const [isPresenting, setPresenting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);
  const [activeIndices, setActiveIndices] = useState<{ h: number; v: number } | null>(null);
  const slideshowRef = useRef<HTMLDivElement | null>(null);

  // The deck reports which slide is showing; map it back to the source range
  // so the markdown pane can highlight and scroll to it.
  const highlightRange = useMemo(
    () => (activeIndices ? slideRangeForIndices(doc, activeIndices.h, activeIndices.v) : null),
    [doc, activeIndices],
  );

  const hasEditAccess = !!editKeyFromUrl;

  // Slideshow mode: overlay the current document (including unsaved edits) as
  // a fullscreen deck. requestFullscreen runs in the effect right after the
  // Present click, still inside the click's transient-activation window;
  // leaving browser fullscreen (Esc) closes the overlay again.
  useEffect(() => {
    if (!isPresenting) return;
    void slideshowRef.current?.requestFullscreen?.()?.catch(() => {
      /* fullscreen unavailable (iframe, permissions) — overlay still shows */
    });
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) {
        void document.exitFullscreen?.()?.catch(() => {});
      }
    };
  }, [isPresenting]);

  const selectedTheme = useMemo(() => {
    const fmTheme = parseFrontMatter(doc).config.theme;
    return normalizeThemeFile(fmTheme ?? presentation.theme ?? "black.css");
  }, [doc, presentation.theme]);

  // The document is the source of truth for the theme too: the selector is a
  // convenience that rewrites the front matter's theme: line.
  const handleThemeChange = (theme: string) => {
    setDoc((current) => setFrontMatterValue(current, "theme", theme));
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
        const encryptedDoc = await encrypt(doc, key);

        await updatePresentation(
          presentation.publicId,
          editKeyFromUrl,
          [{ id: primarySlideId, content: encryptedDoc, order: 1 }],
          selectedTheme
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

  const handleExportPdf = () => {
    // ?print-pdf activates reveal's print view; the decryption key stays in
    // the fragment, which must come after the query string.
    const printUrl = `/present/p/${presentation.publicId}/h?print-pdf${window.location.hash}`;
    window.open(printUrl, "_blank");
  };

  return (
    <div className="flex h-screen flex-col p-4 gap-4">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold mr-4">Edit Presentation</h2>
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
          <Button variant="secondary" onClick={() => setPresenting(true)}>
            Present
          </Button>
          <Button variant="secondary" onClick={() => setShareDialogOpen(true)}>
            Share
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>Export to PDF</Button>
        </div>
        <div className="w-48">
          <ThemeSelector
            selectedTheme={selectedTheme}
            onThemeChange={handleThemeChange}
          />
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
        <ResizablePanel defaultSize={45} minSize={20}>
          <MarkdownPane
            value={doc}
            onChange={setDoc}
            disabled={!hasEditAccess}
            highlight={highlightRange}
            scrollKey={activeIndices ? `${activeIndices.h}-${activeIndices.v}` : ""}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} minSize={20}>
          <RevealDeck
            doc={doc}
            themeFallback={presentation.theme}
            mode="preview"
            onSlideChanged={setActiveIndices}
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        publicId={presentation.publicId}
        editKey={editKeyFromUrl}
      />

      {isPresenting && (
        <div ref={slideshowRef} className="fixed inset-0 z-50 bg-black">
          <RevealDeck
            doc={doc}
            themeFallback={presentation.theme}
            mode="slideshow"
            onSlideChanged={setActiveIndices}
          />
          <button
            type="button"
            aria-label="Exit slideshow"
            onClick={() => setPresenting(false)}
            className="absolute right-3 top-3 z-50 rounded bg-black/50 px-2.5 py-1 text-sm text-white opacity-60 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

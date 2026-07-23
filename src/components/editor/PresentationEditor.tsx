"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/lib/markdown";
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
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(null);

  const hasEditAccess = !!editKeyFromUrl;

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
          <Textarea
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            disabled={!hasEditAccess}
            readOnly={!hasEditAccess}
            spellCheck={false}
            aria-label="Presentation markdown"
            className="h-full w-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} minSize={20}>
          <RevealDeck doc={doc} themeFallback={presentation.theme} mode="preview" />
        </ResizablePanel>
      </ResizablePanelGroup>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        publicId={presentation.publicId}
        editKey={editKeyFromUrl}
      />
    </div>
  );
}

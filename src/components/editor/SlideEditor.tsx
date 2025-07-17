"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { RevealPreview } from "./RevealPreview";

interface SlideEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  theme: string;
}

export function SlideEditor({ content, onContentChange, theme }: SlideEditorProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <ResizablePanelGroup
        direction="horizontal"
        className="w-full rounded-lg border"
        style={{ height: "400px" }}
      >
        <ResizablePanel defaultSize={50}>
          <div className="p-4 h-full">
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="w-full h-full resize-none"
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="h-full w-full overflow-hidden">
            <RevealPreview key={`${content}-${theme}`} markdown={content} theme={theme} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

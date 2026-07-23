"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface MarkdownPaneProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  highlight: { start: number; end: number } | null;
  // Changes only when the active slide changes — scrolling is keyed to this,
  // not to `highlight`, so typing never yanks the scroll position.
  scrollKey: string;
}

// The backdrop must share font, padding, line-height and wrapping with the
// textarea exactly, or highlights drift out of alignment.
const SHARED_TEXT_CLASSES =
  "px-3 py-2 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words";

// Markdown textarea with a metrics-matched backdrop that paints a highlight
// behind the active slide's source and scrolls it into view when the preview
// navigates. A textarea cannot mark a range without hijacking selection and
// focus, hence the mirror-layer approach.
export function MarkdownPane({ value, onChange, disabled, highlight, scrollKey }: MarkdownPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const markRef = useRef<HTMLElement | null>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  // The textarea scrolls; the backdrop doesn't. Its width must shrink by the
  // scrollbar width or long lines wrap differently in the two layers.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const measure = () => setScrollbarWidth(ta.offsetWidth - ta.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(ta);
    return () => observer.disconnect();
  }, []);

  const syncScroll = () => {
    const ta = textareaRef.current;
    const backdrop = backdropRef.current;
    if (ta && backdrop) {
      backdrop.scrollTop = ta.scrollTop;
      backdrop.scrollLeft = ta.scrollLeft;
    }
  };

  // Scroll the highlighted slide into view when the preview moves to it.
  useEffect(() => {
    const ta = textareaRef.current;
    const mark = markRef.current;
    if (!ta || !mark || !scrollKey) return;
    const target = Math.max(0, mark.offsetTop - ta.clientHeight * 0.3);
    if (typeof ta.scrollTo === "function") ta.scrollTo({ top: target, behavior: "smooth" });
    else ta.scrollTop = target;
  }, [scrollKey]);

  const [before, marked, after] = useMemo(() => {
    if (!highlight || highlight.end <= highlight.start) return [value, null, ""] as const;
    return [
      value.slice(0, highlight.start),
      value.slice(highlight.start, highlight.end),
      value.slice(highlight.end),
    ] as const;
  }, [value, highlight]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        ref={backdropRef}
        aria-hidden
        style={{ right: scrollbarWidth }}
        className={`pointer-events-none absolute inset-y-0 left-0 select-none overflow-hidden text-transparent ${SHARED_TEXT_CLASSES}`}
      >
        {before}
        {marked !== null && (
          <mark
            ref={markRef}
            data-editor-highlight=""
            className="rounded-sm bg-amber-400/25 text-transparent"
          >
            {marked}
          </mark>
        )}
        {after}
        {"\n"}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        disabled={disabled}
        readOnly={disabled}
        spellCheck={false}
        aria-label="Presentation markdown"
        className={`relative h-full w-full resize-none bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-60 ${SHARED_TEXT_CLASSES}`}
      />
    </div>
  );
}

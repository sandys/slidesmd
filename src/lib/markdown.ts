// Markdown deck pipeline: front matter parsing, ::: container expansion and
// the reveal.js separator conventions shared by every deck surface.

// Separator attribute values for the reveal.js markdown plugin. Unanchored so
// a plain \n---\n join (no blank lines) still splits slides; attribute values
// take precedence over plugin config and are visible in the DOM for tests.
export const HORIZONTAL_SEPARATOR = "\\r?\\n---\\r?\\n";
export const VERTICAL_SEPARATOR = "\\r?\\n--\\r?\\n";
// reveal 5.2.1 ships a broken default ("^s*notes?:" — the \s collapsed), so we
// always pass an explicit, correct pattern.
export const NOTES_SEPARATOR = "^\\s*notes?:";

export interface DeckConfig {
  theme?: string;
  transition?: string;
  transitionSpeed?: string;
  backgroundTransition?: string;
  slideNumber?: boolean | string;
  slideNumberPosition?: string;
  progress?: boolean;
  header?: string;
  footer?: string;
  headerAlign?: string;
  footerAlign?: string;
  width?: number;
  height?: number;
  margin?: number;
  center?: boolean;
  animateLists?: boolean;
  showNotes?: boolean;
  accent?: string;
}

export const SLIDE_NUMBER_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;

const FRONT_MATTER_KEY = /^[A-Za-z][\w-]*$/;

interface FrontMatterBlock {
  closeIndex: number;
  entries: Array<[string, string]>;
}

// A front matter block exists only when the doc starts with a bare --- line,
// a matching closing --- line follows, and every non-empty line between them
// is a `key: value` pair. Anything else is slide content (e.g. a deck that
// happens to open with a slide separator).
function findFrontMatterBlock(doc: string): FrontMatterBlock | null {
  if (!/^---\r?\n/.test(doc)) return null;
  const lines = doc.split("\n");
  let closeIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].replace(/\r$/, "") === "---") {
      closeIndex = i;
      break;
    }
  }
  if (closeIndex === -1) return null;

  const entries: Array<[string, string]> = [];
  for (const raw of lines.slice(1, closeIndex)) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) return null;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (!FRONT_MATTER_KEY.test(key)) return null;
    entries.push([key, value]);
  }
  return { closeIndex, entries };
}

function assignConfigValue(config: DeckConfig, key: string, value: string) {
  switch (key) {
    case "theme":
    case "transition":
    case "transitionSpeed":
    case "backgroundTransition":
    case "accent":
    case "header":
    case "footer":
      if (value) config[key] = value;
      break;
    case "headerAlign":
    case "footerAlign":
      if (value === "left" || value === "center" || value === "right") config[key] = value;
      break;
    case "slideNumberPosition":
      if ((SLIDE_NUMBER_POSITIONS as readonly string[]).includes(value)) {
        config.slideNumberPosition = value;
      }
      break;
    case "width":
    case "height":
    case "margin": {
      const num = Number.parseFloat(value);
      if (Number.isFinite(num)) config[key] = num;
      break;
    }
    case "center":
    case "animateLists":
    case "showNotes":
    case "progress":
      if (value === "true") config[key] = true;
      else if (value === "false") config[key] = false;
      break;
    case "slideNumber":
      if (value === "true") config.slideNumber = true;
      else if (value === "false") config.slideNumber = false;
      else if (value) config.slideNumber = value;
      break;
    // Unknown keys are ignored so future keys don't break older decks.
  }
}

export function parseFrontMatter(doc: string): { config: DeckConfig; body: string } {
  const block = findFrontMatterBlock(doc);
  if (!block) return { config: {}, body: doc };

  const config: DeckConfig = {};
  for (const [key, value] of block.entries) {
    assignConfigValue(config, key, value);
  }
  const body = doc.split("\n").slice(block.closeIndex + 1).join("\n");
  return { config, body };
}

// Text-level front matter editing so UI controls (like the theme selector)
// stay pure edits of the document.
export function setFrontMatterValue(doc: string, key: string, value: string): string {
  const block = findFrontMatterBlock(doc);
  if (block) {
    const lines = doc.split("\n");
    const keyRe = new RegExp(`^${key}\\s*:`);
    for (let i = 1; i < block.closeIndex; i++) {
      if (keyRe.test(lines[i])) {
        lines[i] = `${key}: ${value}`;
        return lines.join("\n");
      }
    }
    lines.splice(1, 0, `${key}: ${value}`);
    return lines.join("\n");
  }
  return `---\n${key}: ${value}\n---\n\n${doc}`;
}

export function joinLegacySlides(contents: string[]): string {
  return contents.join("\n---\n");
}

export function normalizeThemeFile(theme: string): string {
  const trimmed = theme.trim();
  return trimmed.endsWith(".css") ? trimmed : `${trimmed}.css`;
}

const CONTAINER_OPEN = /^:::\s+(\S.*)$/;
const CONTAINER_SPLIT = /^:::\s*split\s*$/;
const CONTAINER_CLOSE = /^:::\s*$/;
const CODE_FENCE = /^\s{0,3}(`{3,}|~{3,})/;

interface ContainerEntry {
  implicitCol: boolean;
}

// Expands ::: container sugar into div wrappers. marked 4.3 (bundled in the
// reveal markdown plugin) only renders markdown inside an HTML block when a
// blank line follows the opening tag and precedes the closing tag (CommonMark
// type-6), so every emitted tag line is surrounded by blank lines.
export function expandContainers(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  const stack: ContainerEntry[] = [];
  let fenceMarker: string | null = null;

  const emitTag = (tag: string) => {
    out.push("", tag, "");
  };
  const closeTop = () => {
    const entry = stack.pop();
    if (!entry) return;
    if (entry.implicitCol) emitTag("</div>");
    emitTag("</div>");
  };
  const closeAll = () => {
    while (stack.length > 0) closeTop();
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");

    const fenceMatch = line.match(CODE_FENCE);
    if (fenceMatch) {
      if (fenceMarker === null) {
        fenceMarker = fenceMatch[1];
      } else if (
        fenceMatch[1][0] === fenceMarker[0] &&
        fenceMatch[1].length >= fenceMarker.length &&
        line.trim() === fenceMatch[1]
      ) {
        fenceMarker = null;
      }
      out.push(rawLine);
      continue;
    }
    if (fenceMarker !== null) {
      out.push(rawLine);
      continue;
    }

    // Containers are slide-local: a slide separator force-closes them so an
    // unclosed container can never swallow the following slides.
    if (line === "---" || line === "--") {
      closeAll();
      out.push(rawLine);
      continue;
    }

    if (CONTAINER_SPLIT.test(line)) {
      const top = stack[stack.length - 1];
      if (top?.implicitCol) {
        emitTag("</div>");
        emitTag('<div class="col">');
      } else {
        out.push(rawLine);
      }
      continue;
    }

    if (CONTAINER_CLOSE.test(line)) {
      if (stack.length > 0) closeTop();
      else out.push(rawLine);
      continue;
    }

    const open = line.match(CONTAINER_OPEN);
    if (open) {
      const classes = open[1].trim().split(/\s+/).join(" ");
      const implicitCol = classes.split(/\s+/)[0] === "cols";
      emitTag(`<div class="${classes}">`);
      if (implicitCol) emitTag('<div class="col">');
      stack.push({ implicitCol });
      continue;
    }

    out.push(rawLine);
  }

  closeAll();
  return out.join("\n");
}

export function processDoc(doc: string): { config: DeckConfig; markdown: string } {
  const { config, body } = parseFrontMatter(doc);
  return { config, markdown: expandContainers(body) };
}

// Maps reveal slide indices (h = horizontal, v = vertical) back to the
// character range of that slide's source in the ORIGINAL document, so the
// editor can highlight and scroll to what the preview is showing. Walks the
// raw body with the same separator regexes reveal uses (container expansion
// never adds or removes separator lines, so slide order is identical).
export function slideRangeForIndices(
  doc: string,
  h: number,
  v: number,
): { start: number; end: number } | null {
  const { body } = parseFrontMatter(doc);
  const bodyOffset = doc.length - body.length;
  const combined = new RegExp(`${HORIZONTAL_SEPARATOR}|${VERTICAL_SEPARATOR}`, "mg");
  const horizontal = new RegExp(HORIZONTAL_SEPARATOR);

  const trim = (start: number, end: number) => {
    while (start < end && (body[start] === "\n" || body[start] === "\r")) start++;
    while (end > start && (body[end - 1] === "\n" || body[end - 1] === "\r")) end--;
    return { start: bodyOffset + start, end: bodyOffset + end };
  };

  let ch = 0;
  let cv = 0;
  let segStart = 0;
  let match: RegExpExecArray | null;
  while ((match = combined.exec(body))) {
    if (ch === h && cv === v) return trim(segStart, match.index);
    if (horizontal.test(match[0])) {
      ch += 1;
      cv = 0;
    } else {
      cv += 1;
    }
    segStart = match.index + match[0].length;
  }
  if (ch === h && cv === v) return trim(segStart, body.length);
  return null;
}

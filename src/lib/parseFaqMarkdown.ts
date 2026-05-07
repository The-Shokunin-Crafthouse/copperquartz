/*
 * Parse public/copy/faq-content.md into a structured FAQ shape.
 *
 *   ### Section Name
 *   **Question?**
 *   Answer paragraph(s).
 *   - **Bullet lead** — bullet body
 *
 * Output:
 *   FaqSection[] → { title, items: FaqItem[] }
 *   FaqItem      → { question, paragraphs: FaqBlock[] }
 *   FaqBlock     → text paragraph | bullet list
 *
 * Inline `**bold**` runs inside bullet leads and answer text are kept as
 * { type: 'strong', text } segments so the renderer can style them
 * without dropping back to dangerouslySetInnerHTML.
 */

export type FaqInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'link'; text: string; href: string };

export type FaqBlock =
  | { type: 'paragraph'; runs: FaqInline[] }
  | { type: 'list'; items: FaqInline[][] };

export type FaqItem = {
  question: string;
  blocks: FaqBlock[];
};

export type FaqSection = {
  title: string;
  items: FaqItem[];
};

export type FaqDocument = {
  sections: FaqSection[];
  closingNote: FaqInline[] | null;
};

const SECTION_RE = /^###\s+(.+)$/;
const QUESTION_RE = /^\*\*(.+?)\*\*\s*$/;
const BULLET_RE = /^-\s+(.+)$/;
const HORIZONTAL_RULE = /^---\s*$/;
const CLOSING_RE = /^\*(.+?)\*\s*$/;
const SUPERTITLE_RE = /^##\s+/;
const TITLE_RE = /^#\s+/;

export function parseFaqMarkdown(source: string): FaqDocument {
  const lines = source.split(/\r?\n/);
  const sections: FaqSection[] = [];
  let closingNote: FaqInline[] | null = null;

  let currentSection: FaqSection | null = null;
  let currentItem: FaqItem | null = null;
  let pendingParagraph: string[] = [];
  let pendingList: string[] | null = null;

  const flushParagraph = () => {
    if (!currentItem) return;
    if (!pendingParagraph.length) return;
    currentItem.blocks.push({
      type: 'paragraph',
      runs: parseInline(pendingParagraph.join(' ')),
    });
    pendingParagraph = [];
  };

  const flushList = () => {
    if (!currentItem) return;
    if (!pendingList || !pendingList.length) {
      pendingList = null;
      return;
    }
    currentItem.blocks.push({
      type: 'list',
      items: pendingList.map((line) => parseInline(line)),
    });
    pendingList = null;
  };

  const flushItem = () => {
    flushParagraph();
    flushList();
    if (currentItem && currentSection) {
      currentSection.items.push(currentItem);
    }
    currentItem = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (HORIZONTAL_RULE.test(line)) {
      flushItem();
      continue;
    }
    if (TITLE_RE.test(raw) || SUPERTITLE_RE.test(raw)) {
      continue;
    }

    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      flushItem();
      currentSection = { title: sectionMatch[1].trim(), items: [] };
      sections.push(currentSection);
      continue;
    }

    const questionMatch = line.match(QUESTION_RE);
    if (questionMatch) {
      flushItem();
      currentItem = { question: questionMatch[1].trim(), blocks: [] };
      continue;
    }

    const bulletMatch = line.match(BULLET_RE);
    if (bulletMatch) {
      flushParagraph();
      if (!pendingList) pendingList = [];
      pendingList.push(bulletMatch[1].trim());
      continue;
    }

    const closingMatch = line.match(CLOSING_RE);
    if (closingMatch && !currentItem) {
      closingNote = parseInline(closingMatch[1].trim());
      continue;
    }

    if (currentItem) {
      flushList();
      pendingParagraph.push(line);
    }
  }

  flushItem();

  return { sections, closingNote };
}

/* Token order matters: `[**bold link**](href)` is rare in practice but
   the link regex runs first so the bold inside the label stays
   unprocessed (kept as plain text inside the link). Keep the markdown
   simple — one inline style per run. */
function parseInline(text: string): FaqInline[] {
  const runs: FaqInline[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined && match[2] !== undefined) {
      runs.push({ type: 'link', text: match[1], href: match[2] });
    } else if (match[3] !== undefined) {
      runs.push({ type: 'strong', text: match[3] });
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    runs.push({ type: 'text', text: text.slice(lastIndex) });
  }
  return runs.length ? runs : [{ type: 'text', text }];
}

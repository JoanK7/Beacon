// Parses Beacon's lesson markup into blocks the module page can render.
// Plain text in, plain data out: nothing is ever injected as HTML. The server
// checks the same syntax before seeding (server/src/content/markup-check.ts),
// and docs/design/style-guide.md ("Learning blocks") explains it for authors.
//
// Blocks are separated by a blank line:
//   > Tip: text                      callout (Tip, Remember, Example, Watch out, Try this)
//   + Front | Back                   flip cards (one per line)
//   ? Question / [ ] or [x] option / = explanation    "Check yourself"
//   ?? Prompt / = suggested answer   "Think, then reveal"
//   - item, 1. item, plain text      bullets, step list, paragraph
// Anywhere: **key term** is shown in bold.

export type CalloutKind = 'tip' | 'remember' | 'example' | 'watch out' | 'try this';

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'callout'; kind: CalloutKind; text: string }
  | { type: 'cards'; cards: { front: string; back: string }[] }
  | { type: 'check'; prompt: string; options: { text: string; correct: boolean }[]; explanation: string }
  | { type: 'reveal'; prompt: string; answer: string };

const CALLOUT = /^(tip|remember|example|watch out|try this):\s*(.+)$/i;
const OPTION = /^\[( |x)\]\s+(.+)$/i;
const BULLET = /^-\s+(.+)$/;
const STEP = /^\d+\.\s+(.+)$/;

/** Split a line of text into plain and **bold** segments. */
export function parseInline(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/\*\*(.+?)\*\*/)
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((s) => s.text);
}

export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const first = lines[0];
    if (!first) continue;
    blocks.push(...parseChunk(lines, first));
  }
  return blocks;
}

function parseChunk(lines: string[], first: string): Block[] {
  if (first.startsWith('?? ')) {
    const answer = afterEquals(lines);
    if (answer) return [{ type: 'reveal', prompt: first.slice(3).trim(), answer }];
  } else if (first.startsWith('? ')) {
    const options = lines.flatMap((l) => {
      const m = OPTION.exec(l);
      return m ? [{ text: m[2]!.trim(), correct: m[1]!.toLowerCase() === 'x' }] : [];
    });
    const explanation = afterEquals(lines);
    if (options.length >= 2 && options.filter((o) => o.correct).length === 1 && explanation) {
      return [{ type: 'check', prompt: first.slice(2).trim(), options, explanation }];
    }
  } else if (first.startsWith('> ')) {
    const text = lines.map((l) => l.replace(/^>\s?/, '')).join(' ');
    const m = CALLOUT.exec(text);
    if (m) return [{ type: 'callout', kind: m[1]!.toLowerCase() as CalloutKind, text: m[2]!.trim() }];
    return [{ type: 'paragraph', text }];
  } else if (first.startsWith('+ ')) {
    const cards = lines.map((l) => l.replace(/^\+\s?/, '').split(' | '));
    if (cards.every((c) => c.length === 2 && c[0]!.trim() && c[1]!.trim())) {
      return [{ type: 'cards', cards: cards.map(([front, back]) => ({ front: front!.trim(), back: back!.trim() })) }];
    }
  }
  return parseFlow(lines);
}

/** Everything after "= " lines, joined (the explanation or suggested answer). */
function afterEquals(lines: string[]): string {
  return lines
    .filter((l) => l.startsWith('= '))
    .map((l) => l.slice(2).trim())
    .join(' ');
}

/** Ordinary text: runs of bullets, numbered steps and paragraph lines. */
function parseFlow(lines: string[]): Block[] {
  const out: Block[] = [];
  for (const line of lines) {
    const bullet = BULLET.exec(line);
    const step = STEP.exec(line);
    const last = out[out.length - 1];
    if (bullet) {
      if (last?.type === 'bullets') last.items.push(bullet[1]!);
      else out.push({ type: 'bullets', items: [bullet[1]!] });
    } else if (step) {
      if (last?.type === 'steps') last.items.push(step[1]!);
      else out.push({ type: 'steps', items: [step[1]!] });
    } else if (last?.type === 'paragraph') {
      last.text += ` ${line}`;
    } else {
      out.push({ type: 'paragraph', text: line });
    }
  }
  // A paragraph that is only a bold phrase (e.g. "**PFA is:**") reads as a small heading.
  return out.map((b) => (b.type === 'paragraph' && /^\*\*[^*]+\*\*$/.test(b.text) ? { type: 'heading', text: b.text.slice(2, -2) } : b));
}

const CALLOUT_LABEL: Record<CalloutKind, string> = {
  tip: 'Tip',
  remember: 'Remember',
  example: 'Example',
  'watch out': 'Watch out',
  'try this': 'Try this',
};

export const calloutLabel = (kind: CalloutKind) => CALLOUT_LABEL[kind];

/**
 * Plain text for reading aloud. Includes callouts, both sides of flip cards and
 * the question and options of a check, but never reveals answers.
 */
export function toPlainText(body: string): string {
  const sentence = (s: string) => {
    const t = s.replace(/\*\*/g, '').trim();
    return /[.!?:…"”]$/.test(t) ? t : `${t}.`;
  };
  return parseBody(body)
    .map((b) => {
      switch (b.type) {
        case 'heading':
        case 'paragraph':
          return sentence(b.text);
        case 'bullets':
        case 'steps':
          return b.items.map(sentence).join(' ');
        case 'callout':
          return `${CALLOUT_LABEL[b.kind]}: ${sentence(b.text)}`;
        case 'cards':
          return b.cards.map((c) => `${sentence(c.front.replace(/[:.]$/, ''))} ${sentence(c.back)}`).join(' ');
        case 'check':
          return `Check yourself. ${sentence(b.prompt)} ${b.options.map((o) => sentence(o.text)).join(' ')}`;
        case 'reveal':
          return `Think about it. ${sentence(b.prompt)}`;
      }
    })
    .join(' ');
}

/** Rough reading time in minutes (about 200 words a minute), at least 1. */
export function readingMinutes(body: string): number {
  const words = toPlainText(body).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

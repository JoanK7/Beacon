// Checks lesson text written in Beacon's lesson markup, so a typo in a module
// fails the tests and the deploy instead of showing a broken block to learners.
// The app renders the same markup in client/lib/content-markup.ts; the syntax
// is documented in docs/design/style-guide.md ("Learning blocks").
//
// Blocks are separated by a blank line:
//   > Tip: text                      callout (Tip, Remember, Example, Watch out, Try this)
//   + Front | Back                   flip cards (one per line)
//   ? Question / [ ] or [x] option / = explanation    "Check yourself"
//   ?? Prompt / = suggested answer   "Think, then reveal"
//   - item, 1. item, plain text      bullets, step list, paragraph
// Anywhere: **key term** is shown in bold.

export const CALLOUT_TYPES = ['tip', 'remember', 'example', 'watch out', 'try this'] as const;

const CALLOUT = /^(tip|remember|example|watch out|try this):\s*\S/i;
const OPTION = /^\[( |x)\]\s+\S/i;

export function validateMarkup(body: string): string[] {
  const problems: string[] = [];
  const blocks = body.split(/\n\s*\n/).map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean));

  for (const lines of blocks) {
    const first = lines[0];
    if (!first) continue;
    const where = `block starting "${first.slice(0, 40)}"`;

    if ((lines.join(' ').match(/\*\*/g)?.length ?? 0) % 2 !== 0) problems.push(`${where}: unmatched ** (bold marker)`);

    if (first.startsWith('?? ')) {
      if (!lines.some((l) => l.startsWith('= '))) problems.push(`${where}: a reveal prompt needs a "= suggested answer" line`);
    } else if (first.startsWith('? ')) {
      const options = lines.filter((l) => OPTION.test(l));
      const correct = options.filter((l) => /^\[x\]/i.test(l));
      if (options.length < 2) problems.push(`${where}: a check needs at least two "[ ]" options`);
      if (correct.length !== 1) problems.push(`${where}: a check needs exactly one correct "[x]" option`);
      if (!lines.some((l) => l.startsWith('= '))) problems.push(`${where}: a check needs a "= explanation" line`);
      const stray = lines.slice(1).filter((l) => !OPTION.test(l) && !l.startsWith('= '));
      if (stray.length) problems.push(`${where}: unexpected line "${stray[0]}"`);
    } else if (first.startsWith('> ')) {
      if (!CALLOUT.test(first.slice(2).trim())) {
        problems.push(`${where}: callouts start with one of: ${CALLOUT_TYPES.join(', ')} (followed by ":")`);
      }
    } else if (first.startsWith('+ ')) {
      for (const l of lines) {
        const parts = l.startsWith('+ ') ? l.slice(2).split(' | ') : [];
        if (parts.length !== 2 || parts.some((p) => !p.trim())) problems.push(`${where}: each card is "+ Front | Back" ("${l}")`);
      }
    }
  }
  return problems;
}

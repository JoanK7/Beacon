// Quick reference for the lesson markup, shown in the admin module editor so
// Solid Minds staff can format lessons without learning any code.
const ROWS: [string, string][] = [
  ['**key term**', 'Bold key term'],
  ['- item', 'Bullet point (one per line)'],
  ['1. step', 'Numbered step list, for ideas that come in order'],
  ['> Tip: text', 'Bea’s tip. Also: > Remember:, > Example:, > Watch out:, > Try this:'],
  ['+ Front | Back', 'Flip card (one per line; tap to see the back)'],
  ['? Question\n[ ] wrong option\n[x] right option\n= why it is right', '“Check yourself” question (practice only, not saved)'],
  ['?? Question\n= suggested answer', '“Think, then reveal” prompt'],
];

export function FormattingHelp() {
  return (
    <details className="rounded-xl bg-sky-soft p-3 text-sm">
      <summary className="cursor-pointer font-bold text-brand-900">Formatting help</summary>
      <p className="mt-2 text-muted">Leave a blank line between blocks (paragraphs, lists, callouts, cards, questions).</p>
      <table className="mt-2 w-full text-left">
        <thead className="sr-only">
          <tr>
            <th>Type this</th>
            <th>To get</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([code, result]) => (
            <tr key={code} className="border-t border-line align-top">
              <td className="py-2 pr-3">
                <code className="whitespace-pre rounded bg-white px-1.5 py-0.5 text-xs">{code}</code>
              </td>
              <td className="py-2">{result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Renders module text: blank lines separate paragraphs, and lines starting
// with "- " become a bulleted list. Plain text only, so no HTML injection.
export function FormattedText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className="space-y-4 leading-relaxed text-ink">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter(Boolean);
        if (lines.length && lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-beacon-500">
              {lines.map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}

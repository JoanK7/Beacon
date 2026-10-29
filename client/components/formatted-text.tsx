// Renders lesson text written in Beacon's lesson markup (see lib/content-markup.ts):
// paragraphs, bold key terms, bullet and step lists, callouts, flip cards, quick
// checks and reveal prompts. Plain text only, so there is no HTML injection.
import { parseBody, type Block } from '@/lib/content-markup';
import { BulletList, Callout, FlipCards, QuickCheck, RevealPrompt, RichText, StepList } from './learning-blocks';

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case 'heading':
      return (
        <h3 key={key} className="pt-1 text-base font-extrabold text-brand-900">
          {block.text}
        </h3>
      );
    case 'paragraph':
      return (
        <p key={key}>
          <RichText text={block.text} highlight />
        </p>
      );
    case 'bullets':
      return <BulletList key={key} items={block.items} />;
    case 'steps':
      return <StepList key={key} items={block.items} />;
    case 'callout':
      return <Callout key={key} kind={block.kind} text={block.text} />;
    case 'cards':
      return <FlipCards key={key} cards={block.cards} />;
    case 'check':
      return <QuickCheck key={key} prompt={block.prompt} options={block.options} explanation={block.explanation} />;
    case 'reveal':
      return <RevealPrompt key={key} prompt={block.prompt} answer={block.answer} />;
  }
}

export function FormattedText({ text }: { text: string }) {
  return <div className="space-y-4 leading-relaxed text-ink">{parseBody(text).map(renderBlock)}</div>;
}

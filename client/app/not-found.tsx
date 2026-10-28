import { LinkButton } from '@/components/ui';
import { Bea } from '@/components/mascot';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Bea mood="think" size={96} />
      <h1 className="text-2xl font-extrabold text-brand-900">Hmm, I can&apos;t find that page</h1>
      <p className="text-muted">It may have moved. Let&apos;s head back somewhere familiar.</p>
      <LinkButton href="/">Go to Beacon home</LinkButton>
    </main>
  );
}

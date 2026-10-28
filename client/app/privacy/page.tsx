import Link from 'next/link';
import { Logo } from '@/components/logo';

export const metadata = { title: 'Privacy notice' };

const SECTIONS = [
  {
    title: 'What we collect',
    items: [
      'A username you choose (a pseudonym), your password (stored only as a secure hash) and your university.',
      'Your training activity: sections viewed, quiz scores and badges.',
      'Support sessions you log: a category, an outcome, optional notes and any referral. Notes must never include names or identifying details of the peer you supported.',
      'Optional self-care reflections: a mood rating and optional text.',
      'Anonymous usability feedback, stored with no link to your account.',
    ],
  },
  {
    title: 'How we protect it',
    items: [
      'Session notes and reflection text are encrypted (AES-256-GCM) before they are stored.',
      'All traffic is encrypted in transit (HTTPS). Sign-in uses a secure, httpOnly session cookie.',
      'Programme coordinators see cohort totals only, never individual records. Averages from fewer than three people are hidden.',
      'Data is used only for the Beacon pilot study and is never sold or shared for marketing.',
    ],
  },
  {
    title: 'Your rights',
    items: [
      'Participation is voluntary. You can stop at any time with no effect on your peer counsellor status.',
      'You can delete individual sessions and reflections, or your whole account, from the Account page. Deletion is permanent.',
      'Questions or requests: contact the Beacon research team through the ALU Peer Counsellors Club.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex h-16 max-w-3xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="text-3xl font-bold text-brand-900">Privacy notice</h1>
        <p className="mt-2 text-muted">
          Beacon is built on privacy-by-design principles and processes personal data in line with Rwanda&apos;s Law
          No. 058/2021 on the protection of personal data and privacy. This notice is a pilot draft pending ethics review.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="text-xl font-semibold text-brand-900">{s.title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-ink marker:text-beacon-500">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="mt-10">
          <Link href="/" className="font-semibold text-brand-700 underline">
            ← Back to Beacon
          </Link>
        </p>
      </main>
    </div>
  );
}

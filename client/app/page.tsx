'use client';

import Link from 'next/link';
import { BookOpen, Heart, MapPin, ShieldCheck, Trophy } from 'lucide-react';
import { useAuth, homeFor } from '@/lib/auth-context';
import { Logo } from '@/components/logo';
import { LinkButton } from '@/components/ui';
import { NotTherapyNotice } from '@/components/safety-notice';
import { Bea, SpeechBubble } from '@/components/mascot';

const FEATURES = [
  { icon: BookOpen, title: 'Core-skills training', text: 'Short modules on listening, boundaries, safe self-disclosure, referral and self-care.' },
  { icon: Trophy, title: 'Quizzes & badges', text: 'Check what you learned, earn badges and see your progress grow.' },
  { icon: MapPin, title: 'Referral directory', text: 'Find the right campus or local service for a peer, quickly.' },
  { icon: Heart, title: 'Self-care check-ins', text: 'Reflect privately after a difficult conversation.' },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-canvas">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <LinkButton href={homeFor(user)}>Open Beacon</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost">
                Sign in
              </LinkButton>
              <LinkButton href="/register" className="hidden sm:inline-flex">
                Create account
              </LinkButton>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <div className="mb-4 flex items-end gap-3">
              <Bea mood="wave" size={80} bob />
              <SpeechBubble className="mb-3">Hi, I&apos;m Bea! Let&apos;s learn together. 👋</SpeechBubble>
            </div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-beacon-100 px-3 py-1 text-xs font-bold text-beacon-700">
              Pilot · ALU Kigali
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-brand-900 sm:text-5xl">
              Be the light for a peer, <span className="text-brand-600">prepared and supported.</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-muted">
              Beacon is a training and support platform for university peer supporters. Build the skills your role
              needs, keep them fresh, and connect peers to the right help.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={user ? homeFor(user) : '/register'} variant="accent" className="px-6">
                {user ? 'Continue learning' : 'Get started'}
              </LinkButton>
              {!user && (
                <LinkButton href="/login" variant="secondary">
                  I already have an account
                </LinkButton>
              )}
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl border border-line/70 bg-white p-5 shadow-[0_2px_12px_rgb(35_64_74/0.06)]">
                <Icon className="mb-3 size-7 text-brand-600" aria-hidden />
                <h2 className="font-semibold text-brand-900">{title}</h2>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 rounded-3xl bg-brand-800 p-6 text-brand-50 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
          <ShieldCheck className="size-10 text-beacon-400" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold text-white">Private by design</h2>
            <p className="mt-1 text-sm">
              You sign up with a pseudonym only. Session notes and reflections are encrypted, feedback is anonymous, and
              coordinators only ever see cohort-level totals, in line with Rwanda&apos;s Law No. 058/2021.{' '}
              <Link href="/privacy" className="font-semibold text-beacon-400 underline">
                Read the privacy notice
              </Link>
            </p>
          </div>
        </section>

        <div className="mt-8">
          <NotTherapyNotice />
        </div>
      </main>
    </div>
  );
}

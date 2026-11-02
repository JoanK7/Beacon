'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { Story } from '@/lib/types';
import { Alert, Button, Card, ErrorState, LinkButton, Loading } from '@/components/ui';
import { FormattedText } from '@/components/formatted-text';
import { ListenButton } from '@/components/listen-button';
import { toPlainText } from '@/lib/content-markup';
import { Bea } from '@/components/mascot';

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error, loading, reload } = useApi<{ story: Story }>(`/stories/${slug}`);
  const [earned, setEarned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;
  const story = data.story;
  const done = story.read || earned !== null;

  async function markRead() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api<{ firstRead: boolean; pointsEarned: number }>(`/stories/${slug}/read`, { method: 'POST' });
      setEarned(res.pointsEarned);
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/stories" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All stories
      </Link>
      <Card as="article" aria-labelledby="story-title" className="space-y-4 sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-coral-700">Peer support story</p>
            <h1 id="story-title" className="mt-1 text-2xl font-extrabold text-brand-900">{story.title}</h1>
          </div>
          <ListenButton text={`${story.title}. ${toPlainText(story.body)}`} label="Listen to this story" />
        </div>
        <FormattedText text={story.body} />
        <p className="text-xs text-muted">An illustrative story based on common peer-support situations, not about real people.</p>
      </Card>

      <Card className="flex items-start gap-3 bg-lavender-50">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-lavender-700" aria-hidden />
        <div>
          <p className="font-bold text-brand-900">Think about it</p>
          <p className="text-sm">{story.reflection}</p>
        </div>
      </Card>

      {saveError && <Alert tone="error">{saveError}</Alert>}
      {done ? (
        <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left" role="status">
          <Bea mood="cheer" size={56} />
          <p className="flex-1 font-semibold text-brand-900">
            {earned ? (
              <span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-beacon-700" aria-hidden /> +{earned} points. Thank you for reading!</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden /> You&apos;ve read this story.</span>
            )}
          </p>
          {story.module && (
            <LinkButton href={`/learn/${story.module.slug}`} variant="secondary">
              <BookOpen className="size-4" aria-hidden /> {story.module.title}
            </LinkButton>
          )}
        </Card>
      ) : (
        <Button onClick={markRead} loading={saving} className="w-full sm:w-auto">
          I&apos;ve read this story
        </Button>
      )}
    </div>
  );
}

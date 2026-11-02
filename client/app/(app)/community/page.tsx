'use client';

// Community wall: peers share how they feel without their name, and others
// answer with a fixed set of kind messages. Peer supporters get drained too;
// this lets them notice and lift each other up.
// Safety: posts leave the wall after 7 days, can be reported, and a note that
// may mention risk shows urgent help to its author and a "reach out" prompt to
// readers. The server never sends names or ids.
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Flag, LifeBuoy, ShieldCheck, Trash2, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { MOODS } from '@/lib/constants';
import type { MoodPost, SupportKind } from '@/lib/types';
import { Alert, Button, Card, EmptyState, ErrorState, Field, Loading, PageHeader, Textarea, cx } from '@/components/ui';
import { Bea, SpeechBubble } from '@/components/mascot';

const MAX_NOTE = 280;

const SUPPORTS: { kind: SupportKind; emoji: string; label: string }[] = [
  { kind: 'hug', emoji: '🤗', label: 'Sending a hug' },
  { kind: 'here_for_you', emoji: '💛', label: 'I’m here for you' },
  { kind: 'you_got_this', emoji: '💪', label: 'You’ve got this' },
  { kind: 'reach_out', emoji: '🤝', label: 'Reach out if you need to talk' },
];

const moodOf = (value: number) => MOODS.find((m) => m.value === value) ?? MOODS[2];

/** "Today", "Yesterday" or "3 days ago": times are already rounded to the hour by the server. */
function when(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function UrgentHelpCard() {
  return (
    <Alert tone="warning" title="You don’t have to carry this alone">
      It sounds like things are really hard right now. Please talk to someone today: the{' '}
      <Link href="/directory?category=emergency" className="font-semibold underline">urgent help</Link> and{' '}
      <Link href="/directory?category=counselling" className="font-semibold underline">counselling</Link> services are there for you.
    </Alert>
  );
}

function ShareForm({ initialMood, onShared }: { initialMood: number | null; onShared: (post: MoodPost) => void }) {
  const [mood, setMood] = useState<number | null>(initialMood);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mood) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ post: MoodPost }>('/community/posts', { method: 'POST', body: { mood, note } });
      setMood(null);
      setNote('');
      onShared(res.post);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card as="form" onSubmit={onSubmit} className="space-y-4" aria-labelledby="share-heading">
      <h2 id="share-heading" className="text-lg font-extrabold text-brand-900">Share how you&apos;re feeling</h2>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-brand-900">Your mood</legend>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <label
              key={m.value}
              className={cx(
                'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2 text-center transition',
                mood === m.value ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-brand-200',
              )}
            >
              <input type="radio" name="wall-mood" checked={mood === m.value} onChange={() => setMood(m.value)} className="sr-only" />
              <span className="text-2xl" aria-hidden>{m.emoji}</span>
              <span className="text-xs font-medium">{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="A short note (optional)" id="wall-note" hint={`${note.length}/${MAX_NOTE}. Please don't include names or details that could identify anyone.`}>
        <Textarea id="wall-note" value={note} maxLength={MAX_NOTE} onChange={(e) => setNote(e.target.value)} className="min-h-20" />
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="size-3.5" aria-hidden /> Shared without your username, for 7 days
        </p>
        <Button type="submit" loading={saving} disabled={!mood}>Share anonymously</Button>
      </div>
    </Card>
  );
}

function PostCard({ post, onChange, onRemove }: { post: MoodPost; onChange: (post: MoodPost) => void; onRemove: (id: number) => void }) {
  const mood = moodOf(post.mood);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const support = (kind: SupportKind) =>
    run(async () => {
      const res = await api<{ post: MoodPost }>(`/community/posts/${post.id}/support`, { method: 'POST', body: { kind } });
      onChange(res.post);
    });
  const report = () =>
    run(async () => {
      if (!window.confirm('Report this post as unkind or unsafe? Posts with several reports are hidden until an admin reviews them.')) return;
      const res = await api<{ hidden: boolean }>(`/community/posts/${post.id}/report`, { method: 'POST' });
      if (res.hidden) onRemove(post.id);
      else onChange({ ...post, reportedByMe: true });
    });
  const remove = () =>
    run(async () => {
      if (!window.confirm('Delete your post?')) return;
      await api(`/community/posts/${post.id}`, { method: 'DELETE' });
      onRemove(post.id);
    });

  return (
    <Card as="li" className={cx('space-y-3', post.mine && 'border-brand-200')}>
      <div className="flex items-start gap-3">
        <span className="text-3xl" role="img" aria-label={`Feeling ${mood.label.toLowerCase()}`}>{mood.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-900">
            Feeling {mood.label.toLowerCase()}
            <span className="font-normal text-muted"> · {when(post.postedAt)}{post.mine ? ' · your post' : ''}</span>
          </p>
          {post.note && <p className="mt-1 break-words text-ink">{post.note}</p>}
        </div>
      </div>
      {post.needsCare && (
        <p className="flex items-start gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-800">
          <LifeBuoy className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            This peer may be going through something serious. A kind word helps, and the{' '}
            <Link href="/directory?category=counselling" className="font-semibold underline">Wellness team</Link> can help too.
          </span>
        </p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Send a kind message">
        {SUPPORTS.map((s) => {
          const mine = post.mySupports.includes(s.kind);
          const count = post.supports[s.kind];
          return (
            <button
              key={s.kind}
              type="button"
              onClick={() => support(s.kind)}
              disabled={busy || post.mine}
              aria-pressed={mine}
              title={post.mine ? 'Peers can send kind messages to your post' : s.label}
              className={cx(
                'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 transition disabled:cursor-default',
                mine ? 'bg-brand-100 text-brand-800 ring-brand-200' : 'bg-white text-slate-700 ring-line hover:bg-brand-50',
              )}
            >
              <span aria-hidden>{s.emoji}</span> {s.label}
              {count > 0 && <span className="rounded-full bg-white/80 px-1.5 text-[11px]">{count}</span>}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
      <div className="flex justify-end">
        {post.mine ? (
          <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline">
            <Trash2 className="size-3.5" aria-hidden /> Delete
          </button>
        ) : post.reportedByMe ? (
          <span className="text-xs text-muted">Reported. Thank you.</span>
        ) : (
          <button type="button" onClick={report} disabled={busy} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:underline">
            <Flag className="size-3.5" aria-hidden /> Report
          </button>
        )}
      </div>
    </Card>
  );
}

function CommunityWall() {
  const moodParam = Number(useSearchParams().get('mood'));
  const initialMood = moodParam >= 1 && moodParam <= 5 ? moodParam : null;
  const { data, error, loading, reload } = useApi<{ posts: MoodPost[] }>('/community/posts');
  const [posts, setPosts] = useState<MoodPost[] | null>(null);
  const [needsCare, setNeedsCare] = useState(false);
  const list = posts ?? data?.posts ?? [];

  const replace = (post: MoodPost) => setPosts(list.map((p) => (p.id === post.id ? post : p)));
  const removePost = (id: number) => setPosts(list.filter((p) => p.id !== id));

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="space-y-4">
        <PageHeader title="Community wall" description="Share how you feel, anonymously. Peer supporters get tired too, and a kind word from a peer can lift the day." />
        <ShareForm
          initialMood={initialMood}
          onShared={(post) => {
            setPosts([post, ...list]);
            setNeedsCare(post.needsCare);
          }}
        />
        {needsCare && <UrgentHelpCard />}
        <Card className="flex items-start gap-3 bg-sky-soft">
          <Bea mood="calm" size={44} />
          <SpeechBubble className="flex-1 text-sm">
            Replies are kind messages only. If a post worries you, report it, or talk to the Wellness team.
          </SpeechBubble>
        </Card>
      </div>

      <section aria-labelledby="wall-heading">
        <h2 id="wall-heading" className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand-900">
          <Users className="size-5 text-coral-700" aria-hidden /> How peers are feeling this week
        </h2>
        {loading && !data && <Loading />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data && list.length === 0 && (
          <EmptyState icon={Users} title="No posts this week yet">Be the first to share how you&apos;re doing.</EmptyState>
        )}
        {list.length > 0 && (
          <ul className="space-y-3" aria-live="polite">
            {list.map((post) => (
              <PostCard key={post.id} post={post} onChange={replace} onRemove={removePost} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CommunityWall />
    </Suspense>
  );
}

'use client';

// Scenario player: a chat-style role-play with a simulated peer.
//
// The only state is the list of choices made so far (`path`). The transcript is
// rebuilt from it on every render, the same way the server replays the path to
// check it, so what the learner sees and what is recorded always agree.
// Unhelpful choices show a realistic reaction and Bea's feedback, then the
// learner tries again: there is no way to fail.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, HeartHandshake, RotateCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import type { ChoiceQuality, ScenarioChoice, ScenarioDetail, ScenarioNode, ScenarioResult } from '@/lib/types';
import { Alert, Button, Card, ErrorState, LinkButton, Loading, Pill, cx } from '@/components/ui';
import { Bea, type BeaMood } from '@/components/mascot';
import { Celebration } from '@/components/celebration';
import { ListenButton } from '@/components/listen-button';
import { PersonaAvatar } from '@/components/persona-avatar';

interface PathStep {
  nodeId: string;
  choice: number;
}

type Entry =
  | { kind: 'scene'; text: string }
  | { kind: 'peer'; text: string; scene?: string }
  | { kind: 'you'; text: string }
  | { kind: 'reaction'; text: string }
  | { kind: 'feedback'; quality: ChoiceQuality; text: string };

// Kind, non-judgemental labels: even an unhelpful choice is a learning moment.
const QUALITY: Record<ChoiceQuality, { label: string; mood: BeaMood; card: string; tone: 'success' | 'beacon' | 'coral' }> = {
  helpful: { label: 'Great response', mood: 'cheer', card: 'border-brand-200 bg-brand-50', tone: 'success' },
  okay: { label: 'Good start', mood: 'think', card: 'border-beacon-400/60 bg-beacon-50', tone: 'beacon' },
  unhelpful: { label: "Let's try another way", mood: 'calm', card: 'border-coral-400/40 bg-coral-50', tone: 'coral' },
};

function nodeEntries(node: ScenarioNode | undefined): Entry[] {
  if (!node || node.kind !== 'step') return [];
  const entries: Entry[] = [];
  if (node.scene) entries.push({ kind: 'scene', text: node.scene });
  if (node.says) entries.push({ kind: 'peer', text: node.says, scene: node.scene });
  return entries;
}

/** Replay the path through the script: transcript, where we are, and what to show next. */
function replay(script: ScenarioDetail['script'], path: PathStep[], acknowledged: boolean) {
  let nodeId = script.start;
  const entries: Entry[] = nodeEntries(script.nodes[nodeId]);
  let tried = new Set<number>();
  let lastChoice: ScenarioChoice | null = null;

  path.forEach((step, i) => {
    const node = script.nodes[step.nodeId];
    if (!node || node.kind !== 'step') return;
    const choice = node.choices[step.choice];
    if (!choice) return;
    entries.push({ kind: 'you', text: choice.text });
    if (choice.reaction) entries.push({ kind: 'reaction', text: choice.reaction });
    entries.push({ kind: 'feedback', quality: choice.quality, text: choice.feedback });
    tried.add(step.choice);
    lastChoice = choice;

    const isLast = i === path.length - 1;
    if (choice.next && (!isLast || acknowledged)) {
      nodeId = choice.next;
      tried = new Set();
      entries.push(...nodeEntries(script.nodes[nodeId]));
    }
  });

  const waiting = path.length > 0 && !acknowledged; // feedback shown, waiting for Continue / Try again
  return { nodeId, node: script.nodes[nodeId], entries, tried, waiting, lastChoice: lastChoice as ScenarioChoice | null };
}

function Transcript({ entries, persona }: { entries: Entry[]; persona: ScenarioDetail['persona'] }) {
  const endRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
  }, [entries.length]);

  return (
    <ol className="space-y-3" aria-live="polite" aria-label="Conversation">
      {entries.map((e, i) => {
        const key = `${i}-${e.kind}`;
        if (e.kind === 'scene') {
          return (
            <li key={key} className="animate-pop px-2 text-center text-sm italic text-muted">
              {e.text}
            </li>
          );
        }
        if (e.kind === 'peer') {
          return (
            <li key={key} className="flex animate-pop items-end gap-2">
              <PersonaAvatar persona={persona} size="sm" />
              <div className="max-w-[80%] rounded-3xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-line/70">
                <p className="sr-only">{persona.name} says:</p>
                <p className="text-ink">{e.text}</p>
              </div>
              <ListenButton text={e.text} label={`Listen to ${persona.name}`} compact className="mb-1" />
            </li>
          );
        }
        if (e.kind === 'you') {
          return (
            <li key={key} className="flex animate-pop justify-end">
              <div className="max-w-[80%] rounded-3xl rounded-br-md bg-brand-700 px-4 py-3 text-white shadow-sm">
                <p className="sr-only">You say:</p>
                <p>{e.text}</p>
              </div>
            </li>
          );
        }
        if (e.kind === 'reaction') {
          return (
            <li key={key} className="animate-pop px-2 text-center text-sm text-ink/80">
              {e.text}
            </li>
          );
        }
        const q = QUALITY[e.quality];
        return (
          <li key={key} className={cx('flex animate-pop items-start gap-3 rounded-3xl border p-3', q.card)}>
            <Bea mood={q.mood} size={44} />
            <div className="flex-1 text-sm">
              <Pill tone={q.tone}>{q.label}</Pill>
              <p className="mt-1.5 text-ink">{e.text}</p>
            </div>
          </li>
        );
      })}
      <li ref={endRef} aria-hidden />
    </ol>
  );
}

function Intro({ scenario, onStart }: { scenario: ScenarioDetail; onStart: () => void }) {
  return (
    <Card className="mx-auto max-w-xl space-y-5 text-center sm:p-8">
      <div className="flex justify-center">
        <PersonaAvatar persona={scenario.persona} size="lg" />
      </div>
      <div>
        <p className="text-sm font-bold text-muted">
          {scenario.persona.name} · {scenario.persona.context}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-brand-900">{scenario.title}</h1>
        <p className="mt-2 text-muted">{scenario.summary}</p>
      </div>
      {scenario.sensitive && (
        <Alert tone="warning" title="A note before you start" className="text-left">
          This conversation involves someone sharing thoughts of not wanting to be alive. It is here so you can practise
          responding safely. Take it at your own pace, and you can leave at any time. If it brings things up for you,
          please talk to someone. The <Link href="/directory?category=emergency" className="font-semibold underline">urgent help</Link>{' '}
          and <Link href="/directory?category=counselling" className="font-semibold underline">counselling</Link> services are
          always available.
        </Alert>
      )}
      <ul className="space-y-1 text-left text-sm text-muted">
        <li>💬 Choose what you would say at each moment.</li>
        <li>💡 Bea explains how each response lands, linked to your training.</li>
        <li>🔁 Not quite right? You can always try again.</li>
      </ul>
      <Button onClick={onStart} className="w-full sm:w-auto">
        {scenario.sensitive ? "I'm ready to begin" : 'Start the conversation'} <ArrowRight className="size-4" aria-hidden />
      </Button>
      {!scenario.contentVerified && (
        <p className="text-xs text-muted">Adapted from the Solid Minds peer counsellor training. Pending their review.</p>
      )}
    </Card>
  );
}

function Ending({
  node,
  result,
  submitting,
  submitError,
  onRetrySubmit,
  onReplay,
  scenario,
}: {
  node: Extract<ScenarioNode, { kind: 'ending' }>;
  result: ScenarioResult | null;
  submitting: boolean;
  submitError: string | null;
  onRetrySubmit: () => void;
  onReplay: () => void;
  scenario: ScenarioDetail;
}) {
  return (
    <Card className="animate-pop space-y-4 border-brand-200 text-center sm:p-8">
      <div className="flex justify-center">
        <Bea mood="cheer" size={88} />
      </div>
      <div>
        <h2 className="text-xl font-extrabold text-brand-900">{node.title}</h2>
        <p className="mt-2 text-ink">{node.text}</p>
      </div>
      {node.skills.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Skills you practised</p>
          <div className="flex flex-wrap justify-center gap-2">
            {node.skills.map((s) => (
              <Pill key={s} tone="brand">
                {s}
              </Pill>
            ))}
          </div>
        </div>
      )}
      {submitting && <p className="text-sm text-muted">Saving your practice…</p>}
      {submitError && (
        <Alert tone="error" className="text-left">
          {submitError}{' '}
          <button onClick={onRetrySubmit} className="font-semibold underline">
            Try again
          </button>
        </Alert>
      )}
      {result && (
        <div className="mx-auto max-w-sm rounded-3xl bg-beacon-50 p-4">
          <p className="flex items-center justify-center gap-2 text-2xl font-extrabold text-brand-900">
            <Sparkles className="size-6 text-beacon-700" aria-hidden /> {result.insightScore}% insight
          </p>
          <p className="mt-1 text-xs text-muted">
            Based on your first response at each moment. Replaying lets you explore the paths you didn&apos;t take.
            {result.firstCompletion && ' +40 points added to your journey.'}
          </p>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={onReplay}>
          <RotateCcw className="size-4" aria-hidden /> Play again
        </Button>
        {scenario.module && (
          <LinkButton href={`/learn/${scenario.module.slug}`} variant="secondary">
            <BookOpen className="size-4" aria-hidden /> Revisit “{scenario.module.title}”
          </LinkButton>
        )}
        <LinkButton href="/practice">More conversations</LinkButton>
      </div>
    </Card>
  );
}

function Player({ scenario }: { scenario: ScenarioDetail }) {
  const [started, setStarted] = useState(false);
  const [path, setPath] = useState<PathStep[]>([]);
  const [acknowledged, setAcknowledged] = useState(true);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const state = replay(scenario.script, path, acknowledged);

  async function submit(finalPath: PathStep[]) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api<{ result: ScenarioResult }>(`/scenarios/${scenario.slug}/complete`, {
        method: 'POST',
        body: { path: finalPath },
      });
      setResult(res.result);
      setCelebrate(true);
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function choose(index: number) {
    setPath([...path, { nodeId: state.nodeId, choice: index }]);
    setAcknowledged(false);
  }

  function proceed() {
    setAcknowledged(true);
    const next = state.lastChoice?.next;
    if (next && scenario.script.nodes[next]?.kind === 'ending') void submit(path);
  }

  function replayScenario() {
    window.speechSynthesis?.cancel();
    setPath([]);
    setAcknowledged(true);
    setResult(null);
    setSubmitError(null);
    window.scrollTo({ top: 0 });
  }

  if (!started) return <Intro scenario={scenario} onStart={() => setStarted(true)} />;

  const node = state.node;
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <header className="flex items-center gap-3">
        <PersonaAvatar persona={scenario.persona} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold text-brand-900">{scenario.title}</h1>
          <p className="truncate text-xs text-muted">
            {scenario.persona.name} · {scenario.persona.context}
          </p>
        </div>
        {scenario.sensitive && (
          <Link
            href="/directory?category=emergency"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800"
          >
            <ShieldAlert className="size-3.5" aria-hidden /> Help
          </Link>
        )}
      </header>

      <Transcript entries={state.entries} persona={scenario.persona} />

      {state.waiting && state.lastChoice && (
        <div className="flex justify-center">
          {state.lastChoice.next ? (
            <Button onClick={proceed}>
              Continue <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button variant="secondary" onClick={proceed}>
              <RotateCcw className="size-4" aria-hidden /> Try another response
            </Button>
          )}
        </div>
      )}

      {!state.waiting && node?.kind === 'step' && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-bold text-brand-900">What do you say?</legend>
          {node.choices.map((c, i) => {
            const tried = state.tried.has(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={tried}
                className={cx(
                  'block w-full rounded-2xl border-2 bg-white px-4 py-3 text-left font-semibold text-ink transition',
                  tried
                    ? 'cursor-not-allowed border-line text-muted line-through decoration-1'
                    : 'border-brand-100 hover:border-brand-500 hover:bg-brand-50 active:scale-[0.99]',
                )}
              >
                {tried && <span className="sr-only">Already tried: </span>}
                {c.text}
              </button>
            );
          })}
        </fieldset>
      )}

      {!state.waiting && node?.kind === 'ending' && (
        <Ending
          node={node}
          result={result}
          submitting={submitting}
          submitError={submitError}
          onRetrySubmit={() => void submit(path)}
          onReplay={replayScenario}
          scenario={scenario}
        />
      )}

      <Celebration
        show={celebrate && Boolean(result)}
        title={result?.firstCompletion ? 'Conversation complete!' : 'Nice replay!'}
        message={result?.firstCompletion ? 'You earned 40 points for practising.' : 'Every replay sharpens your instincts.'}
        onClose={() => setCelebrate(false)}
      />
    </div>
  );
}

export default function ScenarioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, error, loading, reload } = useApi<{ scenario: ScenarioDetail }>(`/scenarios/${slug}`);

  return (
    <>
      <Link href="/practice" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All practice conversations
      </Link>
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && <Player key={data.scenario.slug} scenario={data.scenario} />}
      {data && (
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <HeartHandshake className="size-3.5" aria-hidden /> Practice only. Your individual choices are not saved; only that you finished and your insight score count towards your progress.
        </p>
      )}
    </>
  );
}

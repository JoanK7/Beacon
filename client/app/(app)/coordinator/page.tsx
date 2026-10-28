'use client';

import { useState, type ReactNode } from 'react';
import { Award, BookOpen, ClipboardList, Compass, Info, MapPin, MessagesSquare, Smile, Table2, Users, type LucideIcon } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { SERVICE_TYPES, SESSION_CATEGORIES, SESSION_OUTCOMES, formatDate } from '@/lib/constants';
import type { CohortDashboard } from '@/lib/types';
import { RequireAuth } from '@/components/require-auth';
import { Card, EmptyState, ErrorState, Loading, PageHeader } from '@/components/ui';

interface BarRow {
  label: string;
  value: number;
}

type Cell = string | number;

interface TableData {
  columns: string[];
  rows: Cell[][];
}

/**
 * Single-series horizontal bar list (one hue, magnitude only), so no legend
 * is needed: the card title names the series. Values are printed in ink
 * beside each bar; hovering a row shows a native tooltip.
 */
function BarList({ rows, max, unit = '', emptyText = 'No data yet.' }: { rows: BarRow[]; max?: number; unit?: string; emptyText?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{emptyText}</p>;
  const scale = max ?? Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${r.value}${unit}`} className="group">
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="text-ink">{r.label}</span>
            <span className="font-semibold tabular-nums text-ink">
              {r.value}
              {unit}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-colors group-hover:bg-brand-800"
              style={{ width: `${(r.value / scale) * 100}%`, minWidth: r.value > 0 ? 4 : 0 }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function DataTable({ columns, rows }: TableData) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-muted">
            {columns.map((c) => <th key={c} className="py-2 pr-4 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60">
              {r.map((cell, j) => <td key={j} className="py-2 pr-4 tabular-nums">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({ title, description, table, children }: { title: string; description?: string; table?: TableData; children: ReactNode }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card as="section" aria-label={title}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-brand-900">{title}</h2>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        {table && (
          <button
            onClick={() => setShowTable((s) => !s)}
            aria-pressed={showTable}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          >
            <Table2 className="size-3.5" aria-hidden /> {showTable ? 'Chart' : 'Table'}
          </button>
        )}
      </div>
      {showTable && table ? <DataTable {...table} /> : children}
    </Card>
  );
}

function Stat({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: Cell | null; hint?: string }) {
  return (
    <Card className="p-4">
      <Icon className="mb-2 size-5 text-brand-500" aria-hidden />
      <p className="text-2xl font-bold tabular-nums text-brand-900">{value ?? '–'}</p>
      <p className="text-xs text-muted">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </Card>
  );
}

function Dashboard() {
  const { data, error, loading, reload } = useApi<{ dashboard: CohortDashboard }>('/dashboard');
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const d = data.dashboard;
  const o = d.overview;
  // Map API enum values to display labels; unknown values fall back to the raw key.
  const label = (map: Record<string, string | { label: string }>, key: string) => {
    const entry = map[key];
    return (typeof entry === 'string' ? entry : entry?.label) || key;
  };
  const categories = d.sessionsByCategory.map((r) => ({ label: label(SESSION_CATEGORIES, r.label), value: r.count }));
  const outcomes = d.sessionOutcomes.map((r) => ({ label: label(SESSION_OUTCOMES, r.label), value: r.count }));
  const referrals = d.referralsByServiceType.map((r) => ({ label: label(SERVICE_TYPES, r.label), value: r.count }));
  const weekly = d.sessionsPerWeek.map((r) => ({ label: `Week of ${formatDate(r.week)}`, value: r.count }));
  const sc = d.skillCheck;
  const skillRows: BarRow[] = [
    ...(sc.preAverage !== null ? [{ label: `Start of pilot (${sc.prePeople} people)`, value: sc.preAverage }] : []),
    ...(sc.postAverage !== null ? [{ label: `End of pilot (${sc.postPeople} people)`, value: sc.postAverage }] : []),
  ];
  const scenarioRows = d.scenarios.map((r) => ({ label: r.title, value: r.completions }));

  return (
    <>
      <PageHeader
        title="Cohort dashboard"
        description={`Anonymous, cohort-level view of the pilot. Updated ${formatDate(d.generatedAt, { dateStyle: 'medium', timeStyle: 'short' })}.`}
      />
      <p className="mb-6 flex items-start gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        No individual records are shown. Averages based on fewer than {d.minGroupSize} responses are hidden to protect
        privacy in a small cohort.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="Peer supporters" value={o.peers} hint={`${o.activeLast14Days} active in last 14 days`} />
        <Stat icon={BookOpen} label="Module completions" value={o.moduleCompletions} />
        <Stat icon={Award} label="Quiz pass rate" value={o.quizPassRate !== null ? `${o.quizPassRate}%` : null} hint={`${o.quizAttempts} attempts · ${o.badgesAwarded} badges`} />
        <Stat icon={ClipboardList} label="Sessions logged" value={o.sessionsLogged} />
        <Stat icon={MapPin} label="Referrals made" value={o.referralsMade} />
        <Stat icon={MessagesSquare} label="Practice conversations" value={o.scenarioCompletions} hint="Scenario play-throughs" />
        <Stat icon={Smile} label="Average mood (30 days, 1–5)" value={d.wellbeing.averageMood} hint={`${d.wellbeing.reflections30Days} check-ins`} />
        <Stat icon={Award} label="Average SUS score" value={d.usability.averageSus} hint={`${d.usability.responses} responses · target ≥ 70`} />
        <Stat
          icon={Compass}
          label="Skill check average"
          value={sc.postAverage !== null ? `${sc.preAverage ?? '–'}% → ${sc.postAverage}%` : sc.preAverage !== null ? `${sc.preAverage}%` : null}
          hint={`${sc.prePeople} at start · ${sc.postPeople} at end`}
        />
      </div>

      {o.peers === 0 ? (
        <EmptyState icon={Users} title="No peer supporters registered yet" />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <ChartCard
            title="Module completion rate"
            description="% of registered peer supporters who completed each module"
            table={{ columns: ['Module', 'Started', 'Completed', 'Badges', 'Rate'], rows: d.modules.map((m) => [m.title, m.started, m.completed, m.badges, `${m.completionRate}%`]) }}
          >
            <BarList rows={d.modules.map((m) => ({ label: m.title, value: m.completionRate }))} max={100} unit="%" />
          </ChartCard>
          <ChartCard
            title="Skill check: before and after"
            description={`Average score (%). Each average needs at least ${d.minGroupSize} people.`}
            table={{
              columns: ['Check', 'People', 'Average'],
              rows: [
                ['Start of pilot', sc.prePeople, sc.preAverage !== null ? `${sc.preAverage}%` : 'Hidden'],
                ['End of pilot', sc.postPeople, sc.postAverage !== null ? `${sc.postAverage}%` : 'Hidden'],
              ],
            }}
          >
            <BarList rows={skillRows} max={100} unit="%" emptyText={`Shown once at least ${d.minGroupSize} people have taken the skill check.`} />
          </ChartCard>
          <ChartCard
            title="Practice conversations"
            description="Play-throughs of each scenario"
            table={{ columns: ['Scenario', 'Completions'], rows: scenarioRows.map((r) => [r.label, r.value]) }}
          >
            <BarList rows={scenarioRows} emptyText="No practice conversations completed yet." />
          </ChartCard>
          <ChartCard
            title="Sessions by topic"
            table={{ columns: ['Topic', 'Sessions'], rows: categories.map((r) => [r.label, r.value]) }}
          >
            <BarList rows={categories} emptyText="No sessions logged yet." />
          </ChartCard>
          <ChartCard
            title="Referrals by service type"
            table={{ columns: ['Service type', 'Referrals'], rows: referrals.map((r) => [r.label, r.value]) }}
          >
            <BarList rows={referrals} emptyText="No referrals yet." />
          </ChartCard>
          <ChartCard
            title="Session outcomes"
            table={{ columns: ['Outcome', 'Sessions'], rows: outcomes.map((r) => [r.label, r.value]) }}
          >
            <BarList rows={outcomes} emptyText="No sessions logged yet." />
          </ChartCard>
          <ChartCard
            title="Sessions per week"
            description="Last 8 weeks"
            table={{ columns: ['Week', 'Sessions'], rows: weekly.map((r) => [r.label, r.value]) }}
          >
            <BarList rows={weekly} emptyText="No sessions in the last 8 weeks." />
          </ChartCard>
        </div>
      )}
    </>
  );
}

export default function CoordinatorPage() {
  return (
    <RequireAuth roles={['coordinator', 'admin']}>
      <Dashboard />
    </RequireAuth>
  );
}

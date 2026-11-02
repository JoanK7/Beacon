'use client';

import { Suspense, useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, Globe, Mail, MapPin, Phone, Search, SearchX } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { SERVICE_TYPES, entries } from '@/lib/constants';
import type { Provider, ServiceType } from '@/lib/types';
import { Card, EmptyState, ErrorState, Input, Loading, PageHeader, Pill, cx } from '@/components/ui';

/** Turn a phone number such as "+250 787 414 774" into a tappable tel: link. */
function phoneHref(contact: string): string | null {
  const match = contact.match(/^\+?[\d\s-]{3,}/);
  return match ? `tel:${match[0].replace(/[\s-]/g, '')}` : null;
}

/** "https://support.alueducation.com/finance" → "support.alueducation.com/finance" for display. */
const displayUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

function ProviderCard({ provider: p }: { provider: Provider }) {
  const type = SERVICE_TYPES[p.serviceType] ?? SERVICE_TYPES.other;
  const tel = p.contact ? phoneHref(p.contact) : null;
  const location = [p.location, p.district].filter(Boolean).join(', ');
  return (
    <Card as="li" className={cx('flex flex-col gap-3', p.serviceType === 'emergency' && 'border-red-200 bg-red-50/40')}>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={type.tone}>{type.label}</Pill>
        {p.onCampus && <Pill tone="brand">On campus</Pill>}
      </div>
      <div>
        <h2 className="text-lg font-bold text-brand-900">{p.name}</h2>
        <p className="mt-1 text-sm text-muted">{p.description}</p>
      </div>
      {/* Each detail is shown only when the service has it (e.g. ALU services list no opening hours). */}
      <dl className="space-y-1.5 text-sm">
        {location && (
          <div className="flex items-start gap-2">
            <dt><MapPin className="mt-0.5 size-4 text-brand-500" aria-label="Location" /></dt>
            <dd>{location}</dd>
          </div>
        )}
        {p.contact && (
          <div className="flex items-start gap-2">
            <dt><Phone className="mt-0.5 size-4 text-brand-500" aria-label="Phone" /></dt>
            <dd>{tel ? <a href={tel} className="font-semibold text-brand-700 underline">{p.contact}</a> : p.contact}</dd>
          </div>
        )}
        {p.email && (
          <div className="flex items-start gap-2">
            <dt><Mail className="mt-0.5 size-4 text-brand-500" aria-label="Email" /></dt>
            <dd className="min-w-0 break-words">
              <a href={`mailto:${p.email}`} className="font-semibold text-brand-700 underline">{p.email}</a>
            </dd>
          </div>
        )}
        {p.website && (
          <div className="flex items-start gap-2">
            <dt><Globe className="mt-0.5 size-4 text-brand-500" aria-label="Website" /></dt>
            <dd className="min-w-0 break-words">
              <a href={p.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
                {displayUrl(p.website)}
              </a>
            </dd>
          </div>
        )}
        {p.hours && (
          <div className="flex items-start gap-2">
            <dt><Clock className="mt-0.5 size-4 text-brand-500" aria-label="Opening hours" /></dt>
            <dd>{p.hours}</dd>
          </div>
        )}
      </dl>
      <Link href={`/sessions/new?provider=${p.id}`} className="mt-auto text-sm font-semibold text-brand-700 hover:underline">
        Log a referral to this service →
      </Link>
    </Card>
  );
}

const isServiceType = (value: string): value is ServiceType => value in SERVICE_TYPES;

/**
 * Filter chips: "All" plus only the service types that have at least one
 * service, so peers never tap a category that shows nothing. A type returns
 * automatically when an admin adds a service of that kind.
 */
function filtersFor(providers: Provider[] | undefined): { value: ServiceType | ''; label: string }[] {
  const present = new Set(providers?.map((p) => p.serviceType));
  return [
    { value: '', label: 'All' },
    ...entries(SERVICE_TYPES)
      .filter(([value]) => present.has(value))
      .map(([value, { label }]) => ({ value, label })),
  ];
}

function Directory({ initial }: { initial: string }) {
  const [category, setCategory] = useState<ServiceType | ''>(isServiceType(initial) ? initial : '');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());

  const params = new URLSearchParams();
  if (deferredQuery) params.set('q', deferredQuery);
  if (category) params.set('category', category);
  const { data, error, loading, reload } = useApi<{ providers: Provider[] }>(`/providers?${params}`);
  // The full, unfiltered list decides which category chips to show.
  const all = useApi<{ providers: Provider[] }>('/providers');
  const filters = filtersFor(all.data?.providers);

  return (
    <>
      <PageHeader
        title="Referral directory"
        description="Campus and local services you can connect a peer with. Emergency services are always listed first."
      />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <label htmlFor="directory-search" className="sr-only">Search services</label>
          <Input
            id="directory-search"
            type="search"
            placeholder="Search by name, need or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div role="group" aria-label="Filter by service type" className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(({ value, label }) => (
            <button
              key={value || 'all'}
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={cx(
                'min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition',
                category === value ? 'bg-brand-700 text-white' : 'bg-white text-slate-700 ring-1 ring-line hover:bg-brand-50',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && data.providers.length === 0 && (
        <EmptyState icon={SearchX} title="No services match your search">Try a different word or clear the filter.</EmptyState>
      )}
      {data && data.providers.length > 0 && (
        <ul className={cx('grid gap-4 md:grid-cols-2', loading && 'opacity-60')} aria-live="polite">
          {data.providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </ul>
      )}
    </>
  );
}

// Re-mount when ?category= changes (e.g. tapping "Urgent help" while already here).
function DirectoryFromUrl() {
  const initial = useSearchParams().get('category') || '';
  return <Directory key={initial} initial={initial} />;
}

export default function DirectoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DirectoryFromUrl />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { SERVICE_TYPES, entries } from '@/lib/constants';
import type { Provider, ServiceType } from '@/lib/types';
import { Alert, Button, Card, ErrorState, Field, Input, Loading, PageHeader, Pill, Select, Textarea, cx } from '@/components/ui';

/** The editable fields of a provider; `id` is present when editing an existing one. */
type ProviderDraft = Omit<Provider, 'id' | 'archived' | 'updatedAt'> & Partial<Pick<Provider, 'id' | 'archived' | 'updatedAt'>>;

type FieldChange = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

const EMPTY: ProviderDraft = {
  name: '',
  serviceType: 'counselling',
  description: '',
  onCampus: true,
  district: 'Gasabo',
  location: '',
  contact: '',
  hours: '',
  verified: false,
};

interface ProviderFormProps {
  initial: ProviderDraft;
  onCancel: () => void;
  onSaved: () => void;
}

function ProviderForm({ initial, onCancel, onSaved }: ProviderFormProps) {
  const [p, setP] = useState<ProviderDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (field: keyof ProviderDraft) => (e: FieldChange) => {
    const t = e.target;
    setP({ ...p, [field]: t instanceof HTMLInputElement && t.type === 'checkbox' ? t.checked : t.value });
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    // Send only the editable fields; the server owns id, archived and updatedAt.
    const { id, archived, updatedAt, ...body } = p;
    try {
      if (initial.id) await api(`/admin/providers/${initial.id}`, { method: 'PUT', body });
      else await api('/admin/providers', { method: 'POST', body });
      onSaved();
    } catch (err) {
      setErrors(err instanceof ApiError ? err.fieldErrors() : {});
      setFormError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Card as="form" onSubmit={onSubmit} className="mb-6 grid gap-4 border-brand-200 sm:grid-cols-2" noValidate>
      <h2 className="text-lg font-semibold text-brand-900 sm:col-span-2">{initial.id ? `Edit ${initial.name}` : 'Add a service'}</h2>
      {formError && <Alert tone="error" className="sm:col-span-2">{formError}</Alert>}
      <Field label="Name" id="p-name" error={errors.name}>
        <Input id="p-name" value={p.name} onChange={set('name')} error={errors.name} />
      </Field>
      <Field label="Service type" id="p-type">
        <Select id="p-type" value={p.serviceType} onChange={set('serviceType')}>
          {entries(SERVICE_TYPES).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description" id="p-desc">
          <Textarea id="p-desc" className="min-h-20" value={p.description} onChange={set('description')} />
        </Field>
      </div>
      <Field label="Location" id="p-loc"><Input id="p-loc" value={p.location} onChange={set('location')} /></Field>
      <Field label="District" id="p-district"><Input id="p-district" value={p.district} onChange={set('district')} /></Field>
      <Field label="Contact" id="p-contact" hint="Phone numbers at the start become tap-to-call links.">
        <Input id="p-contact" value={p.contact} onChange={set('contact')} />
      </Field>
      <Field label="Opening hours" id="p-hours"><Input id="p-hours" value={p.hours} onChange={set('hours')} /></Field>
      <div className="flex flex-wrap gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.onCampus} onChange={set('onCampus')} className="size-5 accent-brand-700" /> On campus
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={p.verified} onChange={set('verified')} className="size-5 accent-brand-700" /> Details verified by clinical partner
        </label>
      </div>
      <div className="flex justify-end gap-3 sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>Save service</Button>
      </div>
    </Card>
  );
}

export default function AdminProvidersPage() {
  const { data, error, loading, reload } = useApi<{ providers: Provider[] }>('/admin/providers');
  const [editing, setEditing] = useState<ProviderDraft | null>(null);

  async function toggleArchive(p: Provider) {
    await api(`/admin/providers/${p.id}/archive`, { method: 'PATCH', body: { archived: !p.archived } });
    reload();
  }

  return (
    <>
      <PageHeader
        title="Referral directory"
        description="Keep services accurate and current. Archived services are hidden from peer supporters but kept for past referral records."
        action={
          !editing && (
            <Button onClick={() => setEditing(EMPTY)}>
              <Plus className="size-4" aria-hidden /> Add service
            </Button>
          )
        }
      />
      {editing && (
        <ProviderForm
          key={editing.id ?? 'new'}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data && (
        <ul className="space-y-3">
          {data.providers.map((p) => (
            <Card as="li" key={p.id} className={cx('flex flex-col gap-3 sm:flex-row sm:items-center', p.archived && 'opacity-60')}>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  <Pill tone={SERVICE_TYPES[p.serviceType].tone}>{SERVICE_TYPES[p.serviceType].label}</Pill>
                  {p.verified ? <Pill tone="success">Verified</Pill> : <Pill tone="beacon">Unverified</Pill>}
                  {p.archived && <Pill tone="danger">Archived</Pill>}
                </div>
                <p className="mt-1 font-semibold text-brand-900">{p.name}</p>
                <p className="text-sm text-muted">{p.contact} · {p.hours}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <Pencil className="size-4" aria-hidden /> Edit
                </Button>
                <Button variant="ghost" onClick={() => toggleArchive(p)}>
                  {p.archived ? <ArchiveRestore className="size-4" aria-hidden /> : <Archive className="size-4" aria-hidden />}
                  {p.archived ? 'Restore' : 'Archive'}
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}

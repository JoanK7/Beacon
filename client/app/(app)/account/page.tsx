'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuth, useUser } from '@/lib/auth-context';
import { formatDate } from '@/lib/constants';
import { Alert, Button, Card, Field, Input, PageHeader } from '@/components/ui';

export default function AccountPage() {
  const { logout } = useAuth();
  const user = useUser();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      await api('/auth/me', { method: 'DELETE' });
      if ('caches' in window) await caches.delete('beacon-api').catch(() => {});
      // Full navigation clears all in-memory data for the deleted account.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/');
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Account & privacy" />

      <Card>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Username</dt>
            <dd className="font-semibold">{user.username}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Role</dt>
            <dd className="font-semibold capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">University</dt>
            <dd className="font-semibold">{user.university}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Member since</dt>
            <dd className="font-semibold">{formatDate(user.createdAt)}</dd>
          </div>
        </dl>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={async () => {
            await logout();
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.assign('/login');
          }}
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </Button>
      </Card>

      <Card className="flex gap-3">
        <ShieldCheck className="size-6 shrink-0 text-brand-600" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-brand-900">How Beacon protects your data</p>
          <p className="mt-1 text-muted">
            Notes and reflections are encrypted, feedback is anonymous and coordinators see only cohort totals.{' '}
            <Link href="/privacy" className="font-semibold text-brand-700 underline">Read the full privacy notice</Link>.
          </p>
        </div>
      </Card>

      <Card className="border-red-200">
        <h2 className="flex items-center gap-2 font-semibold text-red-800">
          <Trash2 className="size-5" aria-hidden /> Delete my account
        </h2>
        <p className="mt-1 text-sm text-muted">
          Permanently deletes your account, training progress, badges, sessions and reflections. This cannot be undone.
          Anonymous feedback cannot be traced to you and is kept.
        </p>
        <div className="mt-4 space-y-3">
          <Field label={`Type "${user.username}" to confirm`} id="confirm-delete">
            <Input id="confirm-delete" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button variant="danger" onClick={deleteAccount} loading={deleting} disabled={confirmText !== user.username}>
            Delete account permanently
          </Button>
        </div>
      </Card>
    </div>
  );
}

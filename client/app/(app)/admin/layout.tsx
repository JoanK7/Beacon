'use client';

import { RequireAuth } from '@/components/require-auth';
import { AdminTabs } from '@/components/admin-tabs';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['admin']}>
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-beacon-700">Content administrator</p>
      </div>
      <AdminTabs />
      {children}
    </RequireAuth>
  );
}

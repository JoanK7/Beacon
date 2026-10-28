'use client';

import { AppShell } from '@/components/app-shell';
import { RequireAuth } from '@/components/require-auth';

// Every page in the (app) route group requires sign-in and shares the navigation shell.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

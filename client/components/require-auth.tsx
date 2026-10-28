'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/lib/types';
import { Alert, LinkButton, Loading } from './ui';

/**
 * Client-side route guard. The API enforces every permission itself; this
 * component only keeps users away from screens they cannot use.
 */
export function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <Loading label="Checking your session…" />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Alert tone="warning" title="This area is restricted">
          Your account does not have access to this page.
        </Alert>
        <LinkButton href="/dashboard" variant="secondary" className="mt-4">
          Back to home
        </LinkButton>
      </div>
    );
  }
  return children;
}

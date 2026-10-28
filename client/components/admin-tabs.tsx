'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from './ui';

const TABS = [
  { href: '/admin', label: 'Training modules', match: (p: string) => p === '/admin' || p.startsWith('/admin/modules') },
  { href: '/admin/scenarios', label: 'Scenarios', match: (p: string) => p.startsWith('/admin/scenarios') },
  { href: '/admin/providers', label: 'Referral directory', match: (p: string) => p.startsWith('/admin/providers') },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cx(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold',
              active ? 'border-brand-700 text-brand-700' : 'border-transparent text-slate-500 hover:text-brand-700',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

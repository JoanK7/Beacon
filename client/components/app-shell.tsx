'use client';

// Responsive navigation shell.
//  * Mobile (< md): compact top bar + fixed bottom tab bar with the five most
//    frequent peer-supporter tasks, all reachable with one thumb.
//  * Desktop (md+): top navigation bar with the same items plus role links.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Heart,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  MessagesSquare,
  Settings,
  Trophy,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Logo } from './logo';
import { UrgentHelpLink } from './safety-notice';
import { cx } from './ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Role, User } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  /** Shorter label for the six-tab mobile bar. */
  short?: string;
  icon: LucideIcon;
}

const PEER_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/practice', label: 'Practice', icon: MessagesSquare },
  { href: '/directory', label: 'Directory', short: 'Services', icon: MapPin },
  { href: '/sessions', label: 'Sessions', short: 'Log', icon: ClipboardList },
  { href: '/reflect', label: 'Reflect', icon: Heart },
];

const ROLE_NAV: Partial<Record<Role, NavItem[]>> = {
  admin: [{ href: '/admin', label: 'Admin', icon: Settings }],
  coordinator: [{ href: '/coordinator', label: 'Cohort', icon: BarChart3 }],
};

const MENU: NavItem[] = [
  { href: '/progress', label: 'Progress & badges', icon: Trophy },
  { href: '/feedback', label: 'Give feedback', icon: MessageSquare },
  { href: '/account', label: 'Account & privacy', icon: UserCircle },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-11 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-extrabold text-white uppercase ring-2 ring-brand-100">
          {user.username.slice(0, 1)}
        </span>
        <span className="hidden sm:inline">{user.username}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-line bg-white p-1 shadow-lg">
          <p className="px-3 py-2 text-xs text-muted">
            Signed in as <span className="font-semibold capitalize text-ink">{user.role}</span>
          </p>
          {MENU.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-brand-50">
              <Icon className="size-4 text-brand-600" aria-hidden />
              {label}
            </Link>
          ))}
          <button
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user: maybeUser, logout } = useAuth();
  const pathname = usePathname();
  // RequireAuth renders this shell only once a user is signed in.
  const user = maybeUser!;
  const roleNav = ROLE_NAV[user.role];
  const desktopNav = [...PEER_NAV, ...(roleNav ?? [])];

  async function handleLogout() {
    await logout();
    // Full navigation clears all in-memory state and avoids racing the auth guard.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/login');
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo href="/dashboard" />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {desktopNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={cx(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                  isActive(pathname, href) ? 'bg-brand-50 font-bold text-brand-700' : 'text-slate-600 hover:bg-brand-50/60 hover:text-brand-700',
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <UrgentHelpLink />
            <UserMenu user={user} onLogout={handleLogout} />
          </div>
        </div>
        {roleNav && (
          <div className="border-t border-line bg-brand-50 px-4 py-1.5 md:hidden">
            {roleNav.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <Icon className="size-4" aria-hidden />
                {label} workspace →
              </Link>
            ))}
          </div>
        )}
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-12">
        {children}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-6">
          {PEER_NAV.map(({ href, label, short, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex min-h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold',
                    active ? 'text-brand-800' : 'text-slate-500',
                  )}
                >
                  {/* Active tab: a soft mint pill behind the icon */}
                  <span className={cx('flex h-8 w-12 items-center justify-center rounded-full transition-colors', active && 'bg-brand-100')}>
                    <Icon className={cx('size-5', active && 'text-brand-700')} aria-hidden strokeWidth={active ? 2.5 : 2} />
                  </span>
                  {short ?? label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

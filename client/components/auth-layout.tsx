import type { ReactNode } from 'react';
import { Logo } from './logo';
import { Bea } from './mascot';

/** Centred card layout for sign-in and registration. */
interface AuthLayoutProps {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-canvas px-4 py-10">
      <div className="mb-2">
        <Logo />
      </div>
      <Bea mood="wave" size={72} bob className="-mb-3" />
      <main className="w-full max-w-md rounded-3xl border border-line/70 bg-white p-6 shadow-[0_8px_30px_rgb(35_64_74/0.08)] sm:p-8">
        <h1 className="text-2xl font-extrabold text-brand-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </main>
      {footer && <div className="mt-6 text-sm text-muted">{footer}</div>}
    </div>
  );
}

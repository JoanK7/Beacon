// Small, accessible UI primitives used across every screen. Keeping them in
// one place enforces the style guide (docs/design/style-guide.md).
import Link from 'next/link';
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  ElementType,
  FormHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, type LucideIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import type { PillTone } from '@/lib/constants';

// Joins class names; later Tailwind utilities override earlier conflicting ones
// (e.g. a Card given bg-brand-900 replaces its default bg-white).
const cx = (...classes: (string | false | null | undefined)[]) => twMerge(classes.filter(Boolean).join(' '));

const BUTTON_VARIANTS = {
  primary: 'bg-brand-700 text-white shadow-sm shadow-brand-700/20 hover:bg-brand-800 disabled:bg-brand-200 disabled:shadow-none',
  accent: 'bg-beacon-500 text-brand-900 shadow-sm shadow-beacon-500/30 hover:bg-beacon-400 disabled:opacity-60',
  secondary: 'bg-white text-brand-700 ring-1 ring-inset ring-brand-200 hover:bg-brand-50 disabled:opacity-60',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-red-700 text-white hover:bg-red-800 disabled:opacity-60',
} as const;
type ButtonVariant = keyof typeof BUTTON_VARIANTS;

const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all active:scale-[0.97] disabled:cursor-not-allowed';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export function Button({ variant = 'primary', loading = false, className, children, ...props }: ButtonProps) {
  return (
    <button className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function LinkButton({ variant = 'primary', className, children, ...props }: LinkButtonProps) {
  return (
    <Link className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], className)} {...props}>
      {children}
    </Link>
  );
}

type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li' | 'form' | 'fieldset';

type CardProps = HTMLAttributes<HTMLElement> &
  Pick<FormHTMLAttributes<HTMLFormElement>, 'noValidate'> & {
    as?: CardElement;
  };

export function Card({ as = 'div', className, children, ...props }: CardProps) {
  const Tag = as as ElementType;
  return (
    <Tag className={cx('rounded-3xl border border-line/70 bg-white p-5 shadow-[0_2px_12px_rgb(35_64_74/0.06)]', className)} {...props}>
      {children}
    </Tag>
  );
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const PILL_TONES: Record<PillTone, string> = {
  brand: 'bg-brand-50 text-brand-700',
  beacon: 'bg-beacon-100 text-beacon-700',
  success: 'bg-emerald-50 text-emerald-800',
  danger: 'bg-red-50 text-red-800',
  neutral: 'bg-slate-100 text-slate-700',
  coral: 'bg-coral-50 text-coral-700',
  lavender: 'bg-lavender-50 text-lavender-700',
};

export function Pill({ tone = 'neutral', className, children }: { tone?: PillTone; className?: string; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', PILL_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, label, tone = 'brand' }: { value: number; label: string; tone?: 'brand' | 'beacon' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-3 w-full overflow-hidden rounded-full bg-brand-50"
    >
      <div
        className={cx('h-full rounded-full transition-all duration-500', tone === 'beacon' ? 'bg-beacon-500' : 'bg-gradient-to-r from-brand-500 to-brand-600')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

type AlertTone = 'info' | 'success' | 'warning' | 'error';

const ALERT_STYLES: Record<AlertTone, [string, LucideIcon]> = {
  info: ['border-brand-200 bg-brand-50 text-brand-900', Info],
  success: ['border-emerald-200 bg-emerald-50 text-emerald-900', CheckCircle2],
  warning: ['border-beacon-400 bg-beacon-50 text-beacon-700', AlertTriangle],
  error: ['border-red-200 bg-red-50 text-red-900', AlertTriangle],
};

interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, className }: AlertProps) {
  const [style, Icon] = ALERT_STYLES[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('flex gap-3 rounded-2xl border p-4 text-sm', style, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      </div>
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  return (
    <Alert tone="error" title="We couldn't load this page">
      <p>{error?.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-semibold underline">
          Try again
        </button>
      )}
    </Alert>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  art?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}

/** Friendly "nothing here yet" panel. Pass `art` (e.g. <Bea />) or an `icon`. */
export function EmptyState({ icon: Icon, art, title, children }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand-100 bg-white/80 px-6 py-10 text-center">
      {art ? <div className="mx-auto mb-3 flex justify-center">{art}</div> : Icon && <Icon className="mx-auto mb-3 size-10 text-brand-200" aria-hidden />}
      <p className="font-bold text-brand-900">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

// Form controls ------------------------------------------------------------

const INPUT =
  'block w-full rounded-2xl border border-line bg-white px-3.5 py-2.5 text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 aria-invalid:border-red-500';

interface FieldProps {
  label: ReactNode;
  id: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, id, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-brand-900">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-red-700" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

type WithError = { error?: string };

export function Input({ id, error, className, ...props }: InputHTMLAttributes<HTMLInputElement> & WithError) {
  return (
    <input
      id={id}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={cx(INPUT, className)}
      {...props}
    />
  );
}

export function Textarea({ id, error, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & WithError) {
  return <textarea id={id} aria-invalid={Boolean(error) || undefined} className={cx(INPUT, 'min-h-28', className)} {...props} />;
}

export function Select({ id, error, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & WithError) {
  return (
    <select id={id} aria-invalid={Boolean(error) || undefined} className={cx(INPUT, 'pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export { cx };

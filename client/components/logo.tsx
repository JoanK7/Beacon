import Link from 'next/link';

/** Beacon mark: a lighthouse light radiating outwards. */
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0f8b7e" />
      <path d="M32 14 L52 8 L52 22 Z" fill="#ffc857" opacity="0.55" />
      <path d="M32 14 L12 8 L12 22 Z" fill="#ffc857" opacity="0.55" />
      <circle cx="32" cy="16" r="6" fill="#ffc857" />
      <path d="M26 24 h12 l3 30 h-18 z" fill="#ffffff" />
      <path d="M25.2 34 h13.6 l0.6 6 h-14.8 z" fill="#ffc857" />
    </svg>
  );
}

export function Logo({ href = '/' }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-bold text-brand-900" aria-label="Beacon home">
      <LogoMark />
      <span className="text-lg tracking-tight">Beacon</span>
    </Link>
  );
}

import Link from 'next/link';
import { LifeBuoy, ShieldAlert } from 'lucide-react';

/** Shown on content pages: Beacon is a training tool, not a clinical service. */
export function NotTherapyNotice() {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        Beacon is a training and support tool for peer supporters. Peer support is not therapy. If someone may be at
        risk of harm, contact emergency services and refer them to professional care straight away.
      </span>
    </p>
  );
}

/** Persistent shortcut to emergency and counselling services. */
export function UrgentHelpLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/directory?category=emergency"
      className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-100 ${className}`}
    >
      <LifeBuoy className="size-4" aria-hidden />
      Urgent help
    </Link>
  );
}

/**
 * Banner for training content that the clinical partner has not yet signed off.
 * `sourceNote` says where the material comes from (e.g. the Solid Minds training).
 */
export function DraftContentBanner({ sourceNote }: { sourceNote?: string | null }) {
  return (
    <div role="note" className="rounded-xl border border-beacon-400 bg-beacon-50 p-3 text-sm text-beacon-700">
      <strong>Pending expert review.</strong>{' '}
      {sourceNote ??
        'This module is a placeholder for the pilot and will be replaced with material verified by a qualified mental health professional.'}
    </div>
  );
}

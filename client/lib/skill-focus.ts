'use client';

import { useMemo } from 'react';
import { useApi } from './use-api';
import type { SkillCheck, SkillSummary } from './types';

/** The most recent skill check the peer took (pre or post), if any. */
export function latestSkillCheck(check: SkillCheck | null): SkillSummary | null {
  const { pre, post } = check?.latest ?? { pre: null, post: null };
  if (pre && post) return new Date(post.takenAt) > new Date(pre.takenAt) ? post : pre;
  return pre ?? post;
}

/**
 * Loads the peer's skill check and returns the modules it suggested practising.
 * `focus` is empty until a check has been taken, so pages work the same as before.
 */
export function useSkillFocus() {
  const { data, loading } = useApi<SkillCheck>('/skill-check');
  const latest = latestSkillCheck(data);
  const focus = useMemo(
    () => new Set(latest?.results.filter((r) => r.level === 'practise').map((r) => r.slug) ?? []),
    [latest],
  );
  return { focus, latest, taken: Boolean(latest), loading };
}

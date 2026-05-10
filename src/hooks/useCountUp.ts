'use client';

import { useEffect, useRef, useState } from 'react';

/*
 * useCountUp — animate an integer from 0 to `target` with ease-out timing
 * and a Promise-of-an-rAF cleanup so unmounts during the animation never
 * call setState on a dead component.
 *
 * Reduced motion: returns `target` immediately and never schedules an rAF.
 * The check is captured once on mount; we don't re-listen for the media
 * query flipping because the admin dashboard is not long-lived enough for
 * that edge to matter and it would force a re-trigger of the animation
 * on every flip, which is the opposite of what reduced-motion users want.
 *
 * Re-animates whenever `target` changes — useful so swapping drink
 * categories re-counts the new card's number.
 */

const EASE_OUT_CUBIC = (t: number) => 1 - Math.pow(1 - t, 3);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useCountUp(
  target: number,
  opts: { durationMs?: number; enabled?: boolean } = {},
): number {
  const { durationMs = 1200, enabled = true } = opts;
  const [value, setValue] = useState<number>(() =>
    enabled && !prefersReducedMotion() ? 0 : target,
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion() || durationMs <= 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;
    const delta = target - from;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      const eased = EASE_OUT_CUBIC(t);
      setValue(Math.round(from + delta * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    setValue(0);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, durationMs, enabled]);

  return value;
}

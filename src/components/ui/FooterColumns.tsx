'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './FooterBar.module.css';

type Edge = 'start' | 'middle' | 'end' | 'none';

/*
 * Footer columns wrapper. Renders the horizontally-scrolling row + the
 * two edge fade overlays, and tracks which edge the row is parked at.
 *
 *   start  — at the left, more content right; show right fade
 *   middle — somewhere in the middle; show both fades
 *   end    — at the right end (RSVP visible); show LEFT fade only so
 *            the gradient does not sit on top of the pill (Sprint 2 fix)
 *   none   — content fits without overflow; hide both fades
 *
 * Listens to scroll + resize on the columns row so the state updates
 * when the viewport changes width or the user swipes.
 */
export default function FooterColumns({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState<Edge>('start');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) {
        setEdge('none');
        return;
      }
      if (el.scrollLeft <= 1) setEdge('start');
      else if (el.scrollLeft >= max - 1) setEdge('end');
      else setEdge('middle');
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div className={styles.columnsWrap} data-scroll-edge={edge}>
      <div ref={ref} className={styles.columns}>
        {children}
      </div>
      <div className={styles.fadeLeft} aria-hidden />
      <div className={styles.fadeRight} aria-hidden />
    </div>
  );
}

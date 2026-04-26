'use client';

import { useEffect, useRef } from 'react';

type Props = {
  className: string;
};

/*
 * Mobile (≤768px) reveals the print bar on first scroll. Desktop ignores
 * the data attribute — the bar is visible from load. One-shot listener:
 * fires once, removes itself, never re-evaluates on scroll-up.
 */
export default function PrintButton({ className }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const root = ref.current?.closest('[data-scroll-root]');
    if (!root) return;

    const onScroll = () => {
      root.setAttribute('data-scrolled', 'true');
      window.removeEventListener('scroll', onScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      ref={ref}
      className={className}
      href="/downloads/save-the-date.pdf"
      download
      aria-label="Download Save the Date PDF"
    >
      Print
    </a>
  );
}

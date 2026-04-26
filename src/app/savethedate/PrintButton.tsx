'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';

type Props = {
  className: string;
};

type Mode = 'desktop' | 'mobile-share' | 'mobile-fallback';

const PDF_HREF = '/downloads/save-the-date.pdf';
const PNG_HREF = '/downloads/save-the-date.png';
const PNG_FILENAME = 'save-the-date.png';
const PNG_MIME = 'image/png';

/*
 * Desktop: download the PDF (existing behavior).
 * Mobile (≤768px viewport AND touch-capable): label becomes "Save to Photos".
 *   - If navigator.canShare({ files }) is supported, tap opens the native
 *     share sheet with the PNG file (iOS: "Save Image" → Photos).
 *   - Otherwise (or if share rejects with a non-cancel error), fall back to
 *     a direct PNG download via the same <a download href>.
 *
 * Mode is detected after hydration; SSR / first paint mirrors desktop so
 * there is no hydration mismatch. The mobile print bar is hidden behind
 * a scroll-triggered reveal, so the brief "Print" → "Save to Photos" swap
 * is not visible to users.
 */
export default function PrintButton({ className }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [mode, setMode] = useState<Mode>('desktop');

  useEffect(() => {
    const isMobileViewport = window.innerWidth <= 768;
    const isTouch = 'ontouchstart' in window;
    if (!isMobileViewport || !isTouch) {
      setMode('desktop');
      return;
    }
    const probe = new File([''], PNG_FILENAME, { type: PNG_MIME });
    const canShareFiles =
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [probe] });
    setMode(canShareFiles ? 'mobile-share' : 'mobile-fallback');
  }, []);

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

  const triggerDownload = () => {
    const a = document.createElement('a');
    a.href = PNG_HREF;
    a.download = PNG_FILENAME;
    a.click();
  };

  const onShareClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (mode !== 'mobile-share') return;
    e.preventDefault();
    try {
      const res = await fetch(PNG_HREF);
      const blob = await res.blob();
      const file = new File([blob], PNG_FILENAME, { type: PNG_MIME });
      if (!navigator.canShare({ files: [file] })) {
        triggerDownload();
        return;
      }
      await navigator.share({ files: [file] });
    } catch (err) {
      // User cancel — leave the button as-is.
      if (err instanceof Error && err.name === 'AbortError') return;
      triggerDownload();
    }
  };

  const isMobile = mode !== 'desktop';
  const href = isMobile ? PNG_HREF : PDF_HREF;
  const label = isMobile ? 'Save to Photos' : 'Print';
  const ariaLabel = isMobile
    ? 'Save Save the Date to Photos'
    : 'Download Save the Date PDF';

  return (
    <a
      ref={ref}
      className={className}
      href={href}
      download
      aria-label={ariaLabel}
      onClick={mode === 'mobile-share' ? onShareClick : undefined}
    >
      {label}
    </a>
  );
}

'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import styles from './Modal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  /* Heading id used for aria-labelledby. The caller renders the heading
     itself inside `children`; the id is set here so the dialog reference
     and the heading stay in lockstep. */
  titleId: string;
  /* Element to return focus to on close — the originating CTA button.
     Captured at click time on the page, threaded down so focus restore
     stays correct if the dialog's parent re-renders. */
  returnFocusTo?: HTMLElement | null;
  /* Optional accessible name for the close button — defaults to "Close".
     Helpful if a localized phrase is desired. */
  closeLabel?: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]),[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/*
 * Dialog shell. Owns:
 *   - mount/unmount choreography so exit transitions can play before the
 *     element leaves the DOM
 *   - focus trap (Tab / Shift+Tab cycle inside)
 *   - focus restore to the originating trigger on close
 *   - body scroll lock while open
 *   - Escape-to-close
 *   - role=dialog + aria-modal + aria-labelledby
 *
 * Animation lives in Modal.module.css. Entry uses @starting-style; exit
 * is driven by `data-state="closing"`. Both run on `--motion-fast` and
 * `--ease-out-soft` (token-map.md) so the modal speaks the site's motion
 * vocabulary. Modals stay center-anchored — they're not tied to a
 * specific trigger, so transform-origin: center is correct (Emil's
 * popover-origin rule explicitly exempts modals).
 */
export default function Modal({
  open,
  onClose,
  titleId,
  returnFocusTo,
  closeLabel = 'Close',
  children,
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  /* Mount/unmount lifecycle. Open flips on → mount immediately. Open
     flips off → start exit, return focus to the trigger now (so the
     user's keyboard stays usable through the fade), then unmount once
     the transition would have ended. Reduced-motion skips the wait. */
  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
      return;
    }
    if (!mounted) return;
    setExiting(true);
    if (returnFocusTo && document.body.contains(returnFocusTo)) {
      returnFocusTo.focus();
    }
    const exitMs = prefersReducedMotion() ? 0 : 220;
    const t = window.setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, exitMs);
    return () => window.clearTimeout(t);
  }, [open, mounted, returnFocusTo]);

  /* Body scroll lock while the dialog has any presence (entering or
     exiting). Restored verbatim on unmount so a stylesheet override of
     overflow isn't clobbered. */
  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  /* Focus trap + Escape. The first focusable element inside the dialog
     receives focus on mount; Tab cycles. Escape closes. The cleanup
     does not restore focus — the open→close effect already did that
     synchronously, so unmount is silent. */
  useEffect(() => {
    if (!mounted || exiting) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const queryFocusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    /* Defer the initial focus to the next frame so transitions don't
       interrupt — Safari occasionally drops focus when applied during
       the same tick a transition starts. */
    const raf = window.requestAnimationFrame(() => {
      const nodes = queryFocusable();
      nodes[0]?.focus();
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = queryFocusable();
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    };
  }, [mounted, exiting, onClose]);

  if (!mounted) return null;

  const dataState = exiting ? 'closing' : 'open';

  return (
    <div
      className={styles.root}
      data-state={dataState}
      onClick={onClose}
      aria-hidden={exiting ? 'true' : undefined}
    >
      <div className={styles.backdrop} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={closeLabel}
        >
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M3 3 L13 13 M13 3 L3 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

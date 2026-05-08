'use client';

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import styles from './Modal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  /* Heading id used for aria-labelledby. The caller owns the heading
     text passed in via `title`; the id is set here so the dialog
     reference and the heading stay in lockstep. */
  titleId: string;
  /* Heading + optional eyebrow rendered inside the palm-leaf header
     band. The body (description, form, submit) is the children prop. */
  title: ReactNode;
  eyebrow?: ReactNode;
  /* Element to return focus to on close — the originating CTA button.
     Captured at click time on the page, threaded down so focus restore
     stays correct if the dialog's parent re-renders. */
  returnFocusTo?: HTMLElement | null;
  /* Optional accessible name for the close button — defaults to
     "Close" to match the site's dialog convention (VideoFrame's
     fullscreen close also uses a single-word label). */
  closeLabel?: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]):not([aria-hidden="true"]),[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const BODY_OPEN_CLASS = 'modal-open';

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
 *   - body scroll lock + `body.modal-open` class while open. The class
 *     drives the global page blur in globals.css — the rest of the
 *     site (.shell) gets `filter: blur(...)` applied uniformly while
 *     this dialog is up. The dialog itself is portaled to `body` so it
 *     sits outside the blurred subtree.
 *   - Escape-to-close
 *   - role=dialog + aria-modal + aria-labelledby
 *   - z-index: 1000 — matches the site's existing dialog convention
 *     (VideoFrame.module.css, PhotoGallery.module.css). Sits above
 *     NavBar (z:5 / drawer z:100 / RSVP z:110) and FooterBar (z:20).
 *
 * Animation lives in Modal.module.css. Entry uses @starting-style; exit
 * is driven by `data-state="closing"`. Both run on `--motion-fast` and
 * `--ease-out-soft` (token-map.md). Modals stay center-anchored — the
 * popover origin-aware rule explicitly exempts modals (Emil).
 */
export default function Modal({
  open,
  onClose,
  titleId,
  title,
  eyebrow,
  returnFocusTo,
  closeLabel = 'Close',
  children,
}: Props) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  /* Keep onClose in a ref so the focus-trap effect doesn't re-run when
     a parent re-renders and passes a fresh function reference. The
     focus-trap effect schedules an rAF that focuses the dialog's first
     focusable; if that effect re-fires after the open→close effect has
     already moved focus back to returnFocusTo, the rAF clobbers focus
     and lands the user back on the close button. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  /* Portal target is document.body — but only after hydration. Gate
     createPortal on this flag to avoid SSR mismatches. */
  useEffect(() => {
    setHasDocument(true);
  }, []);

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

  /* Body scroll lock + the modal-open class that drives the global
     page blur. Both apply while the dialog has any presence (entering
     or exiting). The class is removed after exit so the blur fades
     out in lockstep with the dialog. */
  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add(BODY_OPEN_CLASS);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove(BODY_OPEN_CLASS);
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

    const raf = window.requestAnimationFrame(() => {
      const nodes = queryFocusable();
      nodes[0]?.focus();
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
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
  }, [mounted, exiting]);

  if (!mounted || !hasDocument) return null;

  const dataState = exiting ? 'closing' : 'open';

  const modalTree = (
    <div
      className={styles.root}
      data-state={dataState}
      data-modal-portal
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
        <header className={styles.dialogHeader}>
          {eyebrow ? <p className={styles.dialogEyebrow}>{eyebrow}</p> : null}
          <h2 id={titleId} className={styles.dialogTitle}>
            {title}
          </h2>
        </header>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X size={24} weight="bold" aria-hidden />
        </button>
        <div className={styles.dialogBody}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}

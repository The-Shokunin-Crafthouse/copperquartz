'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { withBase } from '@/src/lib/paths';
import styles from './PhotoGallery.module.css';

export type Photo = {
  file: string;     /* eg "img-1234.jpg" */
  width: number;
  height: number;
};

type Props = {
  photos: Photo[];
  /* Folder under /public where the optimized photos live. Trailing slash
     omitted; leading slash required. */
  basePath?: string;
};

const SWIPE_THRESHOLD = 60;     /* px on touch devices to count as a swipe */
const DEFAULT_BASE = '/images/wedding-photos';

/* Fisher–Yates in-place shuffle, used on first client render so each
   visit lands on a different photo order without re-running the
   optimizer. */
function shuffle<T>(input: readonly T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/*
 * Two-column gallery + lightbox for the Our Story page.
 *
 * Grid is split into left/right columns alternately so each column flows
 * top-to-bottom independently — `column-count` would have given us a
 * Pinterest-style layout but reads images column-major, which makes a
 * scroll-with-thumb awkward when the user is looking for a chronological
 * order. Two flex columns + `aspect-ratio` per cell preserves the natural
 * shape of every photo without CLS.
 *
 * Lightbox is a native <dialog>, mirroring VideoFrame's pattern. Image
 * sizes itself to 80vw / 80vh contain (whichever bounds tighter). Desktop
 * shows Phosphor caret buttons + supports ←/→/Esc; touch hides the
 * buttons and listens for horizontal swipes.
 */
export default function PhotoGallery({ photos, basePath = DEFAULT_BASE }: Props) {
  /* Hold a stable order for SSR + first paint (sorted, deterministic), then
     swap to a freshly shuffled list once the client mounts. Doing the
     shuffle in useEffect — not useState's lazy initializer — keeps the
     server-rendered HTML matching the first client render and avoids the
     hydration mismatch you'd get from Math.random() on both sides. */
  const [order, setOrder] = useState<Photo[]>(photos);
  useEffect(() => {
    setOrder(shuffle(photos));
  }, [photos]);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);

  const open = openIndex !== null;
  const total = order.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % total));
  }, [total]);
  const prev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + total) % total));
  }, [total]);

  /* Drive the native dialog to mirror React state. */
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  /* Native `close` event (Esc or backdrop dismiss) → clear state. */
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const onClose = () => setOpenIndex(null);
    node.addEventListener('close', onClose);
    return () => node.removeEventListener('close', onClose);
  }, []);

  /* Lock body scroll while the lightbox is open and tag <body> with a
     class so global CSS can hide the PageBackdrop palm. The palm uses
     mix-blend-mode: darken, which has known cross-browser bugs with
     <dialog>'s top layer — turning it off entirely while the lightbox
     is open is the only reliable fix. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('lightbox-open');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('lightbox-open');
    };
  }, [open]);

  /* Keyboard navigation: ← prev, → next. Esc handled by <dialog> itself. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, next, prev]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) next();
    else prev();
  };

  /* Distribute photos alternately into two columns so each column flows
     top-to-bottom independently and the totals stay roughly balanced
     even with mixed portrait/landscape sources. */
  const { left, right } = useMemo(() => {
    const l: { photo: Photo; index: number }[] = [];
    const r: { photo: Photo; index: number }[] = [];
    order.forEach((photo, index) => {
      (index % 2 === 0 ? l : r).push({ photo, index });
    });
    return { left: l, right: r };
  }, [order]);

  const current = openIndex !== null ? order[openIndex] : null;

  return (
    <>
      <div className={styles.gallery} role="list">
        {[left, right].map((column, columnIndex) => (
          <div className={styles.column} key={columnIndex}>
            {column.map(({ photo, index }) => (
              <button
                key={photo.file}
                type="button"
                role="listitem"
                className={styles.cell}
                onClick={() => setOpenIndex(index)}
                aria-label={`Open photo ${index + 1} of ${total}`}
                style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
              >
                <Image
                  className={styles.thumb}
                  src={withBase(`${basePath}/${photo.file}`)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={photo.width}
                  height={photo.height}
                />
              </button>
            ))}
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label="Photo viewer"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current && (
          <>
            <button
              type="button"
              className={`${styles.nav} ${styles.navPrev}`}
              aria-label="Previous photo"
              onClick={prev}
            >
              <CaretLeft size={24} weight="bold" aria-hidden />
            </button>
            <div className={styles.stage}>
              <Image
                key={current.file}
                className={styles.full}
                src={withBase(`${basePath}/${current.file}`)}
                alt=""
                width={current.width}
                height={current.height}
                /* aspect-ratio inline keeps the slot reserved while the
                   high-res JPEG decodes during navigation. */
                style={{ aspectRatio: `${current.width} / ${current.height}` }}
              />
            </div>
            <button
              type="button"
              className={`${styles.nav} ${styles.navNext}`}
              aria-label="Next photo"
              onClick={next}
            >
              <CaretRight size={24} weight="bold" aria-hidden />
            </button>
            <button
              type="button"
              className={styles.close}
              aria-label="Close photo viewer"
              onClick={close}
            >
              <X size={24} weight="bold" aria-hidden />
            </button>
            <p className={styles.counter} aria-live="polite">
              {openIndex! + 1} / {total}
            </p>
          </>
        )}
      </dialog>
    </>
  );
}

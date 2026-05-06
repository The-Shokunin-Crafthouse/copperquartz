'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);

  const open = openIndex !== null;
  const total = photos.length;

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

  /* Lock body scroll while the lightbox is open. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
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
  const left: { photo: Photo; index: number }[] = [];
  const right: { photo: Photo; index: number }[] = [];
  photos.forEach((photo, index) => {
    (index % 2 === 0 ? left : right).push({ photo, index });
  });

  const current = openIndex !== null ? photos[openIndex] : null;

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
                <img
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
              <img
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

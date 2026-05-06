'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowsOutSimple, X } from '@phosphor-icons/react';
import { withBase } from '@/src/lib/paths';
import styles from './VideoFrame.module.css';

type VideoFrameProps = {
  src: string;             /* path under /public, eg "/videos/mar-monte.mp4" */
  poster?: string;         /* optional poster path */
  label: string;           /* a11y label — describes the clip ("Mar Monte Hyatt") */
};

/*
 * Cinematic video frame used site-wide. Native aspect of the source is
 * irrelevant — the box owns the 2.76:1 ratio via tokens. Click the
 * expand pill to open a fullscreen dialog that holds the same ratio.
 *
 * Reduced motion: the inline <video> renders paused with poster (if
 * provided), and the dialog video also stays paused — guests who opt
 * out get a still frame, not autoplay.
 */
export default function VideoFrame({ src, poster, label }: VideoFrameProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const resolvedSrc = withBase(src);
  const resolvedPoster = poster ? withBase(poster) : undefined;

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  /* Close on dialog `close` event (Escape key or backdrop dismiss). */
  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    const onClose = () => setOpen(false);
    node.addEventListener('close', onClose);
    return () => node.removeEventListener('close', onClose);
  }, []);

  /* Lock body scroll while fullscreen is open. */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={styles.frame}>
      <video
        className={styles.video}
        src={resolvedSrc}
        poster={resolvedPoster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={label}
      />
      <button
        type="button"
        className={styles.expand}
        aria-label={`View ${label} fullscreen`}
        onClick={() => setOpen(true)}
      >
        <ArrowsOutSimple size={20} weight="bold" aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-label={`${label} — fullscreen`}
        onClick={(e) => {
          /* click on the backdrop (the dialog itself) closes; clicks
             on the inner frame are stopped from bubbling. */
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className={styles.dialogFrame}>
          <video
            className={styles.dialogVideo}
            src={resolvedSrc}
            poster={resolvedPoster}
            autoPlay={open}
            loop
            muted
            playsInline
            preload="metadata"
            aria-label={label}
          />
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Close fullscreen"
          onClick={() => setOpen(false)}
        >
          <X size={24} weight="bold" aria-hidden />
        </button>
      </dialog>
    </div>
  );
}

'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { withBase } from '@/src/lib/paths';
import RegistryButton from './RegistryButton';
import styles from './RegistryTile.module.css';

type Props = {
  imageSrc: string;             /* path under /public, eg "/images/honeymoon.jpg" */
  imageAlt: string;
  /* Optional decorative SVG (wordmark / logo) layered over the image.
     White, with subtle drop-shadow already in the SVG. */
  logoSrc?: string;
  logoAlt?: string;             /* "" = decorative; non-empty = announce it */
  aspectRatio: string;          /* CSS aspect-ratio value, eg "810 / 320" */
  overlayCopy: string;
  ctaLabel: string;
  ctaIcon?: 'heart';
  ctaAriaLabel?: string;        /* extra context for screen readers */
};

/*
 * Reveal-on-hover (desktop) / tap (mobile) tile. The dark overlay panel
 * carries the only CTA, so it must be reachable without hover — keyboard
 * users tab into the full-tile trigger which lifts the panel via
 * `:focus-within`; touch users tap the trigger and a scroll dismisses
 * (per studio direction).
 *
 * The overlay is rendered into the DOM at SSR — there is no on-hover
 * fetch. Animation is CSS-only (RegistryTile.module.css).
 */
export default function RegistryTile({
  imageSrc,
  imageAlt,
  logoSrc,
  logoAlt,
  aspectRatio,
  overlayCopy,
  ctaLabel,
  ctaIcon,
  ctaAriaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const overlayId = useId();
  const tileRef = useRef<HTMLDivElement>(null);

  /* Touch-only: any scroll closes an open overlay. Devices with hover
     don't enter `open` state via JS (they use CSS :hover), so this
     listener is harmless on desktop. Passive listener — no scroll cost. */
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [open]);

  return (
    <div
      ref={tileRef}
      className={styles.tile}
      data-open={open ? 'true' : 'false'}
      style={{ aspectRatio }}
    >
      <img
        className={styles.image}
        src={withBase(imageSrc)}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
      />
      <div className={styles.tint} aria-hidden="true" />
      {logoSrc ? (
        <img
          className={styles.logo}
          src={withBase(logoSrc)}
          alt={logoAlt ?? ''}
          aria-hidden={!logoAlt || logoAlt.length === 0}
        />
      ) : null}

      {/* Full-tile trigger. On hover-capable pointers it's a no-op (CSS
          hover handles reveal) so we mark it cursor:default in CSS. On
          touch it toggles `open`. */}
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={overlayId}
        /* Stable label — `aria-expanded` carries the open/closed state.
           Screen readers announce it as "Show <CTA> details, expanded
           / collapsed", and the label staying constant lets external
           tooling (Playwright preview, automated audits) match it
           regardless of state. */
        aria-label={`Show ${ctaLabel} details`}
        onClick={() => setOpen((v) => !v)}
      />

      <div id={overlayId} className={styles.overlay} role="region">
        <p className={styles.overlayText}>{overlayCopy}</p>
        <RegistryButton
          icon={ctaIcon}
          aria-label={ctaAriaLabel}
          /* Stop click on CTA from re-toggling the trigger underneath. */
          onClick={(e) => e.stopPropagation()}
        >
          {ctaLabel}
        </RegistryButton>
      </div>
    </div>
  );
}

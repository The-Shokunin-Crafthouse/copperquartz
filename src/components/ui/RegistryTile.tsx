'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { withBase } from '@/src/lib/paths';
import RegistryButton from './RegistryButton';
import styles from './RegistryTile.module.css';

/* Crop spec is the Figma mask resolved into CSS:
 *   - aspect: visible-window aspect ratio (CSS aspect-ratio value)
 *   - imageW / imageLeft / imageTop: how the image is sized and shifted
 *     INSIDE the tile. All percentages — width and left are relative
 *     to tile width, top is relative to tile height. height: auto on
 *     the image lets its native aspect drive the rendered height. */
export type TileCrop = {
  aspect: string;
  imageW: string;
  imageLeft: string;
  imageTop: string;
};

type Props = {
  imageSrc: string;             /* path under /public, eg "/images/honeymoon.jpg" */
  imageAlt: string;
  /* Optional decorative wordmark/logo node. Caller passes an inline
     `<svg>` element (eg <HoneymoonWordmark className={...} />) — not
     an <img>, since a CSS drop-shadow on an SVG <img> rasterizes at
     logical-pixel resolution and reads blurry on Retina mobile. */
  logo?: ReactNode;
  /* Per-breakpoint Figma-exact crop. The CSS module reads both via
     custom props and switches at min-width: 769px. */
  desktopCrop: TileCrop;
  mobileCrop: TileCrop;
  /* Wordmark width as % of tile width per breakpoint. Falls through to
     a sane default if a tile has no logo. */
  desktopLogoWidth?: string;
  mobileLogoWidth?: string;
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
  logo,
  desktopCrop,
  mobileCrop,
  desktopLogoWidth = '68%',
  mobileLogoWidth = '87%',
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

  /* Per-tile CSS variables. Inline styles win over the CSS module's
     defaults; the @media (min-width: 769px) inside the module promotes
     the desktop set. Each set is a complete crop so the tile snaps
     between breakpoints without inheriting half a config. */
  const styleVars = {
    '--tile-aspect-mobile': mobileCrop.aspect,
    '--image-w-mobile': mobileCrop.imageW,
    '--image-left-mobile': mobileCrop.imageLeft,
    '--image-top-mobile': mobileCrop.imageTop,
    '--logo-w-mobile': mobileLogoWidth,
    '--tile-aspect-desktop': desktopCrop.aspect,
    '--image-w-desktop': desktopCrop.imageW,
    '--image-left-desktop': desktopCrop.imageLeft,
    '--image-top-desktop': desktopCrop.imageTop,
    '--logo-w-desktop': desktopLogoWidth,
  } as React.CSSProperties;

  return (
    <div
      ref={tileRef}
      className={styles.tile}
      data-open={open ? 'true' : 'false'}
      style={styleVars}
    >
      <img
        className={styles.image}
        src={withBase(imageSrc)}
        alt={imageAlt}
        loading="lazy"
        decoding="async"
      />
      <div className={styles.tint} aria-hidden="true" />
      {logo ? <div className={styles.logo}>{logo}</div> : null}

      {/* Full-tile trigger. On hover-capable pointers it's a no-op (CSS
          hover handles reveal) so we mark it cursor:default in CSS. On
          touch it toggles `open`. */}
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={overlayId}
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

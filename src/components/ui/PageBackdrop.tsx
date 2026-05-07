'use client';

import { usePathname } from 'next/navigation';
import { withBase } from '@/src/lib/paths';
import styles from './PageBackdrop.module.css';

/*
 * Page backdrop shared by all marketing pages. Two modes, picked from
 * the live pathname:
 *
 *   home (`/`)        → fixed palm top-left, fixed courthouse
 *                       bottom-right, fixed coastal bottom-left.
 *   interior (other)  → desktop renders the same trio; on mobile
 *                       (≤768) the courthouse + coastal hide and the
 *                       palm migrates out of the fixed layer into a
 *                       scrolling sibling (.mobilePalm), so it slides
 *                       up out of view as guests scroll past it. The
 *                       fix prevents fixed bleeds from overlapping
 *                       in-flow content on phones.
 */
export default function PageBackdrop() {
  const pathname = usePathname() ?? '/';
  const isHome = pathname === '/' || pathname === '';
  const mode = isHome ? 'home' : 'interior';

  return (
    <>
      <div
        className={styles.backdrop}
        data-mode={mode}
        data-page-backdrop
        aria-hidden
      >
        <img
          className={styles.palm}
          src={withBase('/images/palm-illustration@2x.jpg')}
          alt=""
        />
        <img
          className={styles.courthouse}
          src={withBase('/images/courthouse-illustration@2x.jpg')}
          alt=""
        />
        <img
          className={styles.coastal}
          src={withBase('/images/coastal-scene@2x.png')}
          alt=""
        />
      </div>
      {!isHome && (
        <img
          className={styles.mobilePalm}
          src={withBase('/images/palm-illustration@2x.jpg')}
          alt=""
          aria-hidden
          data-page-backdrop
        />
      )}
    </>
  );
}

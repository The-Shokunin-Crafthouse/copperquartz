import { withBase } from '@/src/lib/paths';
import styles from './PageBackdrop.module.css';

/*
 * Fixed page backdrop shared by all marketing pages. Re-uses the Save
 * the Date asset trio:
 *   palm-illustration@2x.jpg  → top-left bleed (palm + watercolor wash)
 *   courthouse-illustration   → bottom-right, anchored to footer hairline
 *   coastal-scene             → bottom-left, anchored to footer hairline
 * Position: fixed inset:0 — content scrolls past, the backdrop holds.
 */
export default function PageBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden>
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
  );
}

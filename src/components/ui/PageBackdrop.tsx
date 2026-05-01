import { withBase } from '@/src/lib/paths';
import styles from './PageBackdrop.module.css';

/*
 * Fixed page backdrop shared by all marketing pages. Layers, back to front:
 *   1. Watercolor wash (full-page bleed at 60% opacity)
 *   2. Palm illustration (top-left bleed)
 *   3. Coastal water (bottom-left, anchored above the footer hairline)
 *   4. Courthouse (right bleed, anchored to top)
 *   5. Four gradient fades feathering the wash into bg
 * Sits at z-index: -1 inside the (site) layout's isolation context so
 * route content paints above it.
 */
export default function PageBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden>
      <img
        className={styles.wash}
        src={withBase('/images/watercolor-wash@2x.jpg')}
        alt=""
      />
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
      <span className={`${styles.fade} ${styles.fadeTop}`} />
      <span className={`${styles.fade} ${styles.fadeBottom}`} />
      <span className={`${styles.fade} ${styles.fadeLeft}`} />
      <span className={`${styles.fade} ${styles.fadeRight}`} />
    </div>
  );
}

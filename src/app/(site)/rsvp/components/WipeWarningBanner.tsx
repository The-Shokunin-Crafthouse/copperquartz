'use client';

import styles from '../rsvp.module.css';

export default function WipeWarningBanner({
  firstName,
  onUndo,
}: {
  firstName: string;
  onUndo: () => void;
}) {
  return (
    <div className={styles.wipeBanner} role="status">
      <p className={styles.wipeBannerText}>
        Heads up — when you submit, {firstName}&apos;s drink and event preferences
        will be cleared. Toggle back to Attending to keep them.
      </p>
      <button type="button" className={styles.wipeBannerUndo} onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}

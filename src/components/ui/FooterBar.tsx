import { withBase } from '@/src/lib/paths';
import InfoItem from './InfoItem';
import CountdownValue from './CountdownValue';
import styles from './FooterBar.module.css';

type FooterBarProps = {
  /** Wedding date — drives the build-time countdown. */
  weddingDate: string; // ISO yyyy-mm-dd
};

/*
 * Site footer — single hairline divider top, four info columns
 * (Countdown / Date / Location / Venue), wax seal anchored right,
 * palm icons in the bottom corners. Mirrors Figma frame 22:1011.
 */
export default function FooterBar({ weddingDate }: FooterBarProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.divider} aria-hidden />

      <div className={styles.columns}>
        <InfoItem
          label="COUNTDOWN"
          value={<CountdownValue target={weddingDate} />}
        />
        <InfoItem label="IX.XXIX.MMXXVI" value="Sept. 29th, 2026" />
        <InfoItem label="LOCATION" value="Santa Barbara, CA" fixedWidth={false} />
        <InfoItem label="VENUE" value="Sunken Garden" />
      </div>

      <img
        className={styles.badge}
        src={withBase('/images/badge@2x.png')}
        alt=""
      />

      <img
        className={`${styles.palmIcon} ${styles.palmIconBL}`}
        src={withBase('/images/svg/palm-icon.svg')}
        alt=""
      />
      <img
        className={`${styles.palmIcon} ${styles.palmIconBR}`}
        src={withBase('/images/svg/palm-icon.svg')}
        alt=""
      />
    </footer>
  );
}

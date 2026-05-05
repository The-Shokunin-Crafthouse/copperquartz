import { withBase } from '@/src/lib/paths';
import InfoItem from './InfoItem';
import CountdownValue from './CountdownValue';
import RSVPButton from './RSVPButton';
import styles from './FooterBar.module.css';

type FooterBarProps = {
  /** Wedding date — drives the build-time countdown. */
  weddingDate: string; // ISO yyyy-mm-dd
  /** Where the mobile-only RSVP slot points. */
  rsvpHref: string;
};

/*
 * Site footer — single hairline divider top, four info columns
 * (Countdown / Date / Location / Venue), wax seal anchored right,
 * palm icons in the bottom corners. Mirrors Figma frame 22:1011.
 */
export default function FooterBar({ weddingDate, rsvpHref }: FooterBarProps) {
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
        <InfoItem
          label="VENUE"
          value={
            <a
              href="https://www.google.com/maps/search/?api=1&query=1100+Anacapa+St+Santa+Barbara+CA+93101"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sunken Garden
            </a>
          }
        />

        {/* Mobile-only 5th slot — RSVP button positioned where a value
            would normally sit, with the same gold pillar to the left. */}
        <div className={styles.mobileRsvpItem}>
          <div className={styles.mobileRsvpPillar} aria-hidden />
          <RSVPButton href={rsvpHref} label="RSVP" />
        </div>
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

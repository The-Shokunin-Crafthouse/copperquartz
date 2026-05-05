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

const CEREMONY_HREF = 'https://maps.app.goo.gl/W1HYa3VJHi5fbgWm7';
const RECEPTION_HREF = 'https://maps.app.goo.gl/tS9ES4q8SHVE5q2E8';

/*
 * Site footer — single hairline divider top, five info columns
 * (Countdown / Date / Location / Ceremony / Reception), wax seal
 * anchored right at desktop, palm icons in the bottom corners.
 * Mobile (<768) appends a sixth slot with the RSVP pill.
 */
export default function FooterBar({ weddingDate, rsvpHref }: FooterBarProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.divider} aria-hidden />

      <div className={styles.columnsWrap}>
        <div className={styles.columns}>
          <InfoItem
            label="COUNTDOWN"
            value={<CountdownValue target={weddingDate} />}
            fixedWidth={false}
          />
          <InfoItem
            label="IX.XXIX.MMXXVI"
            value="Sept. 29th, 2026"
            fixedWidth={false}
          />
          <InfoItem
            label="LOCATION"
            value="Santa Barbara, CA"
            fixedWidth={false}
          />
          <InfoItem
            label="CEREMONY"
            value="Sunken Garden"
            href={CEREMONY_HREF}
            fixedWidth={false}
          />
          <InfoItem
            label="RECEPTION"
            value="Cabrillo Pavilion"
            href={RECEPTION_HREF}
            fixedWidth={false}
          />

          {/* Mobile-only — RSVP pill sits where a value would, gold
              pillar on the left like every other column. Hidden ≥768
              via styles.mobileRsvpItem. */}
          <div className={styles.mobileRsvpItem}>
            <div className={styles.mobileRsvpPillar} aria-hidden />
            <RSVPButton href={rsvpHref} label="RSVP" />
          </div>
        </div>
        <div className={styles.fadeRight} aria-hidden />
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

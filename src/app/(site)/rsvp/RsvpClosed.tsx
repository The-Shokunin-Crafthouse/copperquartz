import Image from 'next/image';
import { withBase } from '@/src/lib/paths';
import {
  WEDDING_DATE_ROMAN,
  WEDDING_LOCATION,
  countdownLabel,
  daysUntilWedding,
} from './dateHeader';
import styles from './rsvp.module.css';

/*
 * Post-deadline state for /rsvp. Deliberately not a 404: the URL is
 * printed on the invitation inserts, so a guest arriving late deserves an
 * explanation and a way to reach us rather than a dead end.
 *
 * Reuses the Confirmation panel's vocabulary — same heading, body,
 * subline, palm break, footer — so the closed state reads as a member of
 * the existing family rather than a bolted-on error page. No new CSS.
 */
export default function RsvpClosed() {
  const days = daysUntilWedding();
  const countdown = countdownLabel(days);
  const segments = [WEDDING_DATE_ROMAN, countdown, WEDDING_LOCATION].filter(
    (s): s is string => Boolean(s),
  );

  const palmBreak = withBase('/images/svg/palm-break.svg');

  return (
    <section className={styles.confirmation}>
      <h1 className={styles.confirmationHeading}>RSVPs are closed</h1>
      <p className={styles.confirmationBody}>
        Our deadline has passed and the final count is with the venue. If
        something has changed on your end, reach out to us directly and
        we&apos;ll sort it out.
      </p>
      <p className={styles.subline}>
        {segments.map((seg, i) => (
          <span
            key={seg}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <span>{seg}</span>
            {i < segments.length - 1 && (
              <span aria-hidden className={styles.sublinePillar} />
            )}
          </span>
        ))}
      </p>
      <div className={styles.palmBreak} aria-hidden>
        <span className={styles.palmBreakLine} />
        <span className={styles.palmBreakIcon}>
          <Image src={palmBreak} alt="" width={32} height={85} />
        </span>
        <span className={styles.palmBreakLine} />
      </div>
      <p className={styles.confirmationFooter}>
        Take a look at the Venue and Travel pages while you&apos;re here.
      </p>
    </section>
  );
}

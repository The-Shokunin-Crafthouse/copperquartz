import { withBase } from '@/src/lib/paths';
import {
  WEDDING_DATE_ROMAN,
  WEDDING_LOCATION,
  countdownLabel,
  daysUntilWedding,
} from './dateHeader';
import type {
  ConfirmationData,
  ConfirmationError,
} from '@/src/app/actions/getConfirmationData';
import styles from './rsvp.module.css';

function buildAttendingHeading(names: string[]): string {
  if (names.length <= 1) return 'Woohoo!!!';
  if (names.length === 2) return `Woohoo, ${names[0]}!!!`;
  return `Woohoo, ${names[0]} & ${names[1]}!!!`;
}

export default function Confirmation({
  data,
}: {
  data: ConfirmationData | ConfirmationError;
}) {
  const days = daysUntilWedding();
  const countdown = countdownLabel(days);
  const segments = [WEDDING_DATE_ROMAN, countdown, WEDDING_LOCATION].filter(
    (s): s is string => Boolean(s),
  );

  const isError = 'error' in data;
  let heading: string;
  let body: string;
  if (isError) {
    heading = 'Thank you!';
    body = 'Your RSVP has been recorded.';
  } else if (data.variant === 'attending') {
    heading = buildAttendingHeading(data.attending_first_names);
    body =
      'You’re on the list. We cannot wait to celebrate with you. Safe travels and start the countdown!';
  } else {
    heading = 'No worries, honestly!';
    body =
      'We understand this is a cross country trip on short notice for most people. We appreciate the consideration and want you to know you’ve had a profound impact on our lives.';
  }

  const palmBreak = withBase('/images/svg/palm-break.svg');

  return (
    <section className={styles.confirmation}>
      <div className={styles.palmBreak} aria-hidden>
        <span className={styles.palmBreakLine} />
        <span className={styles.palmBreakIcon}>
          <img src={palmBreak} alt="" width={32} height={85} />
        </span>
        <span className={styles.palmBreakLine} />
      </div>
      <h1 className={styles.confirmationHeading}>{heading}</h1>
      <p className={styles.confirmationBody}>{body}</p>
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
          <img src={palmBreak} alt="" width={32} height={85} />
        </span>
        <span className={styles.palmBreakLine} />
      </div>
      <p className={styles.confirmationFooter}>
        Take a look at the Venue and Travel pages while you&apos;re here.
      </p>
    </section>
  );
}

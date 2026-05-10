'use client';

import type { Guest } from '../state';
import styles from '../rsvp.module.css';

export default function StepMondayMeetup({
  attendingGuests,
  mondayMeetup,
  onToggle,
  onContinue,
  onBack,
}: {
  attendingGuests: Guest[];
  mondayMeetup: Record<string, boolean>;
  onToggle: (guestId: string, next: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.stepShell}>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>Monday Evening Meetup</h2>
        <p className={styles.stepBody}>
          For anyone arriving early, we&apos;re planning a casual meetup the
          evening before the wedding on Monday night.
        </p>
        <p className={styles.stepBody}>
          Nothing fancy, no dress code, and completely optional. Food and
          drinks will be available for purchase, so feel free to stop by,
          say hi, and hang for as long as you&apos;d like.
        </p>
      </div>
      <div className={styles.list}>
        {attendingGuests.map((guest) => {
          const id = `monday-${guest.id}`;
          const checked = Boolean(mondayMeetup[guest.id]);
          return (
            <label key={guest.id} htmlFor={id} className={styles.checkRow}>
              <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggle(guest.id, e.target.checked)}
              />
              <span>{guest.full_name}</span>
            </label>
          );
        })}
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.back} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.primary} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

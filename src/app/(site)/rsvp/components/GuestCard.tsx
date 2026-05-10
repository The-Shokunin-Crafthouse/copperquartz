'use client';

import type { Guest } from '../state';
import styles from '../rsvp.module.css';

export default function GuestCard({
  guest,
  attending,
  onChange,
}: {
  guest: Guest;
  attending: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  const groupId = `attendance-${guest.id}`;
  return (
    <div className={styles.guestCard}>
      <div className={styles.guestCardHeader}>
        <p className={styles.guestName}>{guest.full_name}</p>
        {guest.existing_rsvp && (
          <span className={styles.respondedPill}>Already responded</span>
        )}
      </div>
      <div className={styles.attendanceRow} role="radiogroup" aria-labelledby={groupId}>
        <span id={groupId} hidden>
          {`Attendance for ${guest.full_name}`}
        </span>
        <button
          type="button"
          role="radio"
          aria-checked={attending === true}
          data-variant="attending"
          className={styles.attendanceBtn}
          onClick={() => onChange(true)}
        >
          Attending
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={attending === false}
          data-variant="decline"
          className={styles.attendanceBtn}
          onClick={() => onChange(false)}
        >
          Can&apos;t make it
        </button>
      </div>
    </div>
  );
}

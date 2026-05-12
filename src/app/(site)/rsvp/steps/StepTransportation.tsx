'use client';

import type { Guest } from '../state';
import styles from '../rsvp.module.css';

export default function StepTransportation({
  attendingGuests,
  transport,
  onToggle,
  onContinue,
  onBack,
}: {
  attendingGuests: Guest[];
  transport: Record<string, boolean>;
  onToggle: (guestId: string, next: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.stepShell}>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>Getting to the reception</h2>
        <p className={styles.stepBody}>
          We plan to provide Uber/Lyft credits for anyone that needs
          transportation. It&apos;s a short 8 min drive.
        </p>
      </div>
      <div className={styles.list}>
        {attendingGuests.map((guest) => {
          const id = `transport-${guest.id}`;
          const checked = Boolean(transport[guest.id]);
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

'use client';

import GuestCard from '../components/GuestCard';
import WipeWarningBanner from '../components/WipeWarningBanner';
import type { PartyResult } from '@/src/app/actions/lookupParty';
// Guest type re-exported from state.ts (PartyResult['guests'][number])
import styles from '../rsvp.module.css';

export default function StepAttendance({
  party,
  attendance,
  wipeWarnings,
  onAttendanceChange,
  onUndo,
  onContinue,
  onBack,
}: {
  party: PartyResult;
  attendance: Record<string, boolean | undefined>;
  wipeWarnings: Record<string, true>;
  onAttendanceChange: (guestId: string, next: boolean) => void;
  onUndo: (guestId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const allDecided = party.guests.every(
    (g) => attendance[g.id] === true || attendance[g.id] === false,
  );

  return (
    <div className={styles.stepShell}>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>Who&apos;s coming?</h2>
        <p className={styles.stepBody}>
          Select everyone in your party who will be joining us.
        </p>
      </div>
      <div className={styles.list}>
        {party.guests.map((guest) => (
          <div key={guest.id} className={styles.list}>
            <GuestCard
              guest={guest}
              attending={attendance[guest.id]}
              onChange={(next) => onAttendanceChange(guest.id, next)}
            />
            {wipeWarnings[guest.id] && (
              <WipeWarningBanner
                firstName={guest.first_name}
                onUndo={() => onUndo(guest.id)}
              />
            )}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.back} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={!allDecided}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

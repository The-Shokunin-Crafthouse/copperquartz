'use client';

import type { PartyResult } from '@/src/app/actions/lookupParty';
import type { Guest } from '../state';
import styles from '../rsvp.module.css';

export default function StepReview({
  party,
  attendance,
  mondayMeetup,
  transport,
  beverage,
  accommodations,
  submitting,
  submitError,
  onMondayToggle,
  onTransportToggle,
  onAccommodationsChange,
  onEditAttendance,
  onEditDrink,
  onSubmit,
  onBack,
}: {
  party: PartyResult;
  attendance: Record<string, boolean | undefined>;
  mondayMeetup: Record<string, boolean>;
  transport: Record<string, boolean>;
  beverage: Record<string, { category: string; selection: string | null }>;
  accommodations: string;
  submitting: boolean;
  submitError: string | null;
  onMondayToggle: (guestId: string) => void;
  onTransportToggle: (guestId: string) => void;
  onAccommodationsChange: (next: string) => void;
  onEditAttendance: () => void;
  onEditDrink: (guest: Guest) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.stepShell}>
      <button
        type="button"
        className={styles.reviewEditFloat}
        onClick={onEditAttendance}
      >
        Edit attendance
      </button>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>Make it count</h2>
        <p className={styles.stepBody}>
          Let&apos;s double check the details.
        </p>
      </div>

      <div className={styles.list}>
        {party.guests.map((guest) => {
          const isAttending = attendance[guest.id] === true;
          const drink = beverage[guest.id];
          const drinkValue = drink
            ? drink.selection
              ? `${drink.category}: ${drink.selection}`
              : drink.category
            : '—';

          if (!isAttending) {
            return (
              <div
                key={guest.id}
                className={styles.reviewBlock}
                data-declined="true"
              >
                <div className={styles.reviewBlockHeader}>
                  <p className={styles.guestName}>{guest.full_name}</p>
                  <span className={styles.declinedTag}>not attending</span>
                </div>
              </div>
            );
          }

          return (
            <div key={guest.id} className={styles.reviewBlock}>
              <div className={styles.reviewBlockHeader}>
                <p className={styles.guestName}>{guest.full_name}</p>
                {guest.existing_rsvp && (
                  <span className={styles.respondedPill}>Already responded</span>
                )}
              </div>
              <div className={styles.reviewMeta}>
                <button
                  type="button"
                  className={styles.reviewToggle}
                  aria-pressed={Boolean(mondayMeetup[guest.id])}
                  onClick={() => onMondayToggle(guest.id)}
                >
                  Monday meetup
                </button>
                <button
                  type="button"
                  className={styles.reviewToggle}
                  aria-pressed={Boolean(transport[guest.id])}
                  onClick={() => onTransportToggle(guest.id)}
                >
                  Reception ride
                </button>
              </div>
              <div className={styles.reviewMeta}>
                <span className={styles.reviewLabel}>Drink: {drinkValue}</span>
                <button
                  type="button"
                  className={styles.editLink}
                  onClick={() => onEditDrink(guest)}
                >
                  Edit drink
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="rsvp-review-accommodations" className={styles.label}>
          Special requests
        </label>
        <textarea
          id="rsvp-review-accommodations"
          className={styles.textarea}
          value={accommodations}
          onChange={(e) => onAccommodationsChange(e.target.value)}
          placeholder="Optional: allergies, mobility needs, dietary restrictions, etc."
        />
      </div>

      {submitError && (
        <p role="alert" className={styles.submitError}>
          {submitError}
        </p>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.back}
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </button>
        <button
          type="button"
          className={styles.primary}
          aria-busy={submitting}
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting && <span className={styles.spinner} aria-hidden />}
          {submitting ? 'Submitting…' : 'Submit RSVP'}
        </button>
      </div>
    </div>
  );
}

'use client';

import type { ExistingAccommodations } from '../state';
import styles from '../rsvp.module.css';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function StepAccommodations({
  value,
  existing,
  onChange,
  onContinue,
  onBack,
}: {
  value: string;
  existing: ExistingAccommodations | null;
  onChange: (next: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.stepShell}>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>Any special requests?</h2>
        <p className={styles.stepBody}>
          You can literally request anything, anything at all, and we&apos;ll
          make it happen.
        </p>
      </div>
      {existing && (
        <div className={styles.existingNote}>
          <p className={styles.eyebrow}>Existing note from your party</p>
          <p className={styles.existingNoteMeta}>
            {existing.last_edited_by_first_name
              ? `Last edited by ${existing.last_edited_by_first_name} on ${formatDate(existing.updated_at)}`
              : `Last edited on ${formatDate(existing.updated_at)}`}
          </p>
          <p className={styles.existingNoteHint}>
            Edit below to update, or leave it as-is to keep it.
          </p>
        </div>
      )}
      <div className={styles.fieldGroup}>
        <label htmlFor="rsvp-accommodations" className={styles.label}>
          Special Request
        </label>
        <textarea
          id="rsvp-accommodations"
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=""
        />
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.back} onClick={onBack}>
          Back
        </button>
        <button type="button" className={styles.primary} onClick={onContinue}>
          Review RSVP
        </button>
      </div>
    </div>
  );
}

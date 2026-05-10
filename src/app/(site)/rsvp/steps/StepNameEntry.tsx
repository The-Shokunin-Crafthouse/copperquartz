'use client';

import { useState } from 'react';
import { lookupParty, type PartyResult } from '@/src/app/actions/lookupParty';
import styles from '../rsvp.module.css';

type ErrorReason = 'no_match' | 'ambiguous' | 'server_error';

const ERROR_COPY: Record<ErrorReason, string> = {
  no_match:
    "We couldn't find that name. Try your full name or the name your invitation was addressed to.",
  ambiguous:
    'We found more than one guest with that name. Please enter your full name.',
  server_error: 'Something went wrong. Please try again.',
};

export default function StepNameEntry({
  onSuccess,
}: {
  onSuccess: (party: PartyResult, query: string) => void;
}) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorReason | null>(null);

  async function runLookup() {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await lookupParty(trimmed);
      if ('error' in result) {
        setError(result.error);
      } else {
        onSuccess(result, trimmed);
      }
    } catch {
      setError('server_error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.stepShell}>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>Let&apos;s kick this off</h2>
        <p className={styles.stepBody}>
          Type your first name, last name, or the name on your invitation.
        </p>
      </div>
      <div className={styles.fieldGroup}>
        <label htmlFor="rsvp-name" className={styles.label}>
          Your Name
        </label>
        <input
          id="rsvp-name"
          name="rsvp-name"
          type="text"
          autoComplete="name"
          className={styles.input}
          value={value}
          disabled={loading}
          aria-busy={loading}
          aria-invalid={error !== null}
          aria-describedby={error ? 'rsvp-name-error' : undefined}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onBlur={() => {
            if (value.trim()) void runLookup();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runLookup();
            }
          }}
        />
        {error && (
          <p id="rsvp-name-error" role="alert" className={styles.fieldError}>
            {ERROR_COPY[error]}
          </p>
        )}
      </div>
    </div>
  );
}

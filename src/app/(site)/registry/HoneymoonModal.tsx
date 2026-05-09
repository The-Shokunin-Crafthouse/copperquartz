'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { createCheckoutSession } from '@/src/app/actions/createCheckoutSession';
import Modal from './Modal';
import {
  chargedCentsCoveringFee,
  formatCents,
  formatCentsCompact,
  isValidEmail,
  parseDollarsToCents,
} from './cents';
import styles from './forms.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
};

export default function HoneymoonModal({ open, onClose, returnFocusTo }: Props) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const amountId = useId();
  const messageId = useId();
  const errorId = useId();
  const emailErrorId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [coverFee, setCoverFee] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = useMemo(() => parseDollarsToCents(amount), [amount]);
  const finalChargedCents =
    amountCents != null
      ? coverFee
        ? chargedCentsCoveringFee(amountCents)
        : amountCents
      : null;
  const feeCents =
    amountCents != null && finalChargedCents != null && coverFee
      ? finalChargedCents - amountCents
      : null;

  function validateEmailOnBlur() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(null); // empty is handled by submit-time required check
      return;
    }
    setEmailError(isValidEmail(trimmed) ? null : 'Please enter a valid email address.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    const cents = parseDollarsToCents(amount);
    if (cents == null) {
      setError('Please enter an amount greater than zero.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    const result = await createCheckoutSession({
      name: name.trim(),
      email: trimmedEmail,
      amountCents: cents,
      coverFee,
      fund: 'honeymoon',
      message: message.trim() || undefined,
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    /* External (Stripe) URL — next/navigation router.push does not
       leave the origin, so use a full-page navigation here. */
    window.location.assign(result.url);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId={titleId}
      title="Honeymoon"
      eyebrow="Levi & Meghan"
      returnFocusTo={returnFocusTo}
    >
      <p className={styles.body}>
        Wherever the road takes us after September 29th — your generosity will
        be put towards extra upgrades to make our time together extra special.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={nameId}>
            Your Name
          </label>
          <input
            id={nameId}
            className={styles.input}
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={emailId}>
            Email Address
          </label>
          <input
            id={emailId}
            className={styles.input}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={validateEmailOnBlur}
            aria-invalid={emailError ? 'true' : undefined}
            aria-describedby={emailError ? emailErrorId : undefined}
          />
          {emailError ? (
            <p className={styles.fieldError} id={emailErrorId} role="alert">
              {emailError}
            </p>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={amountId}>
            Amount
          </label>
          <div className={styles.amountWrap}>
            <input
              id={amountId}
              className={styles.input}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <label className={styles.feeRow}>
          <input
            type="checkbox"
            className={styles.feeCheckbox}
            checked={coverFee}
            onChange={(e) => setCoverFee(e.target.checked)}
          />
          {coverFee && amountCents != null && finalChargedCents != null && feeCents != null ? (
            <span>
              Cover the processing fee of {formatCentsCompact(feeCents)}. Your card
              will be charged {formatCentsCompact(finalChargedCents)} – the bride
              and groom receive {formatCentsCompact(amountCents)}.
            </span>
          ) : (
            <span>Cover the processing fee</span>
          )}
        </label>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={messageId}>
            A note for the couple (optional)
          </label>
          <textarea
            id={messageId}
            className={styles.textarea}
            rows={3}
            maxLength={450}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {error ? (
          <p className={styles.error} id={errorId} role="alert">
            <svg
              className={styles.errorIcon}
              viewBox="0 0 14 14"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 4 V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="7" cy="10.2" r="0.8" fill="currentColor" />
            </svg>
            <span>{error}</span>
          </p>
        ) : null}

        <button
          type="submit"
          className={styles.submit}
          disabled={submitting}
          aria-busy={submitting}
          aria-describedby={error ? errorId : undefined}
        >
          {submitting ? (
            <>
              <span className={styles.submitSpinner} aria-hidden="true" />
              <span>Sending…</span>
            </>
          ) : (
            <span>
              Checkout
              {finalChargedCents != null ? ` — ${formatCents(finalChargedCents)}` : ''}
            </span>
          )}
        </button>
      </form>
    </Modal>
  );
}

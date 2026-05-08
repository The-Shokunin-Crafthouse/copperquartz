'use client';

import { useId, useState, type FormEvent } from 'react';
import { selfReportContribution } from '@/src/app/actions/selfReportContribution';
import Modal from './Modal';
import styles from './forms.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
};

function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/[$,]/g, '');
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(parseFloat(trimmed) * 100);
  return cents > 0 ? cents : null;
}

export default function HdmgModal({ open, onClose, returnFocusTo }: Props) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const amountId = useId();
  const messageId = useId();
  const errorId = useId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanked, setThanked] = useState(false);

  /* Reset state when the modal closes so a re-open doesn't show a stale
     thank-you. The parent toggles `open`; reset on the close transition. */
  function handleClose() {
    onClose();
    /* Defer the reset until after the modal's exit transition so the
       form doesn't visibly snap mid-fade. */
    window.setTimeout(() => {
      setName('');
      setEmail('');
      setAmount('');
      setMessage('');
      setError(null);
      setSubmitting(false);
      setThanked(false);
    }, 240);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    const cents = parseDollarsToCents(amount);
    if (cents == null) {
      setError('Please enter the amount you donated.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setSubmitting(true);
    const result = await selfReportContribution({
      name: name.trim(),
      email: email.trim(),
      amountCents: cents,
      fund: 'howlin-dog',
      message: message.trim() || undefined,
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setThanked(true);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      titleId={titleId}
      returnFocusTo={returnFocusTo}
    >
      {thanked ? (
        <>
          <h2 id={titleId} className={styles.thanksHeading}>
            Thank you.
          </h2>
          <p className={styles.thanksBody}>
            We mean that. It means a lot to both of us.
          </p>
          <button
            type="button"
            className={styles.thanksClose}
            onClick={handleClose}
          >
            Close
          </button>
        </>
      ) : (
        <>
          <p className={styles.eyebrow}>Meghan&rsquo;s pick</p>
          <h2 id={titleId} className={styles.heading}>
            Howlin Dog Music Group
          </h2>
          <p className={styles.intro}>
            You&rsquo;ve opened the Howlin Dog page in a new tab. Once you&rsquo;ve
            donated there, let us know here so we can thank you properly.
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
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={amountId}>
                Amount you donated
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

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={messageId}>
                A note for the couple (optional)
              </label>
              <textarea
                id={messageId}
                className={styles.textarea}
                rows={3}
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
                <span>Let Us Know</span>
              )}
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}

'use client';

import { useId, useState, type FormEvent } from 'react';
import { selfReportContribution } from '@/src/app/actions/selfReportContribution';
import Modal from './Modal';
import { isValidEmail, parseDollarsToCents } from './cents';
import styles from './forms.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
};

export default function HdmgModal({ open, onClose, returnFocusTo }: Props) {
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
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanked, setThanked] = useState(false);

  function validateEmailOnBlur() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(null);
      return;
    }
    setEmailError(isValidEmail(trimmed) ? null : 'Please enter a valid email address.');
  }

  /* Reset state when the modal closes so a re-open doesn't show a stale
     thank-you. The parent toggles `open`; reset on the close transition. */
  function handleClose() {
    onClose();
    /* Defer the reset until after the modal's exit transition so the
       form doesn't visibly snap mid-fade. */
    window.setTimeout(() => {
      setName('');
      setEmail('');
      setEmailError(null);
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

    const trimmedAmount = amount.trim();
    let cents = 0;
    if (trimmedAmount) {
      const parsed = parseDollarsToCents(trimmedAmount);
      if (parsed == null) {
        setError('Please enter a valid amount or leave it blank.');
        return;
      }
      cents = parsed;
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
    const result = await selfReportContribution({
      name: name.trim(),
      email: trimmedEmail,
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
      title="Howlin Dog Music Group"
      eyebrow="Meghan’s pick"
      returnFocusTo={returnFocusTo}
    >
      {thanked ? (
        <>
          <h3 className={styles.thanksHeading}>Thank you.</h3>
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
          <p className={styles.body}>
            You&rsquo;ve opened the Howlin Dog page in a new tab. Once
            you&rsquo;ve donated there, let us know here so we can thank you
            properly.
          </p>

          <a
            className={styles.donateLink}
            href="https://www.howlindogmusicgroup.org/support-hdmg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate at Howlin Dog &rarr;
          </a>

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
                Amount you donated (optional)
              </label>
              <div className={styles.amountWrap}>
                <input
                  id={amountId}
                  className={styles.input}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
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
                <span>Let Us Know</span>
              )}
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}

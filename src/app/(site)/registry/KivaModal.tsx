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
  /* Mounts the modal directly in its post-Stripe thank-you state. Set
     by RegistryActions when /registry?success=true&fund=kiva. */
  initialThanked?: boolean;
};

type BorrowerChoice = 'mine' | 'couple';

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function KivaModal({
  open,
  onClose,
  returnFocusTo,
  initialThanked = false,
}: Props) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const amountId = useId();
  const messageId = useId();
  const referenceUrlId = useId();
  const errorId = useId();
  const emailErrorId = useId();

  const [borrower, setBorrower] = useState<BorrowerChoice>('mine');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [coverFee, setCoverFee] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanked, setThanked] = useState(initialThanked);

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

  /* Reset state when the modal closes so a re-open doesn't show a stale
     thank-you. The parent toggles `open`; reset on the close transition. */
  function handleClose() {
    onClose();
    /* Defer the reset until after the modal's exit transition so the
       form doesn't visibly snap mid-fade. */
    window.setTimeout(() => {
      setBorrower('mine');
      setReferenceUrl('');
      setName('');
      setEmail('');
      setEmailError(null);
      setAmount('');
      setCoverFee(true);
      setMessage('');
      setError(null);
      setSubmitting(false);
      setThanked(false);
    }, 240);
  }

  function validateEmailOnBlur() {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(null);
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

    let trimmedRef: string | undefined;
    if (borrower === 'mine') {
      trimmedRef = referenceUrl.trim();
      if (trimmedRef && !isHttpUrl(trimmedRef)) {
        setError('Please paste a full Kiva URL beginning with https://.');
        return;
      }
      if (!trimmedRef) trimmedRef = undefined;
    }

    setSubmitting(true);
    const result = await createCheckoutSession({
      name: name.trim(),
      email: trimmedEmail,
      amountCents: cents,
      coverFee,
      fund: 'kiva',
      referenceUrl: trimmedRef,
      lendersChoice: borrower === 'couple',
      message: message.trim() || undefined,
    });

    if ('error' in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    window.location.assign(result.url);
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      titleId={titleId}
      title="Kiva"
      eyebrow="Levi’s pick"
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
        Kiva connects lenders with entrepreneurs around the world who need small
        loans to build something. You can pick a specific person, or let us
        choose.
      </p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.radioGroup}>
          <legend>Borrower</legend>
          <label className={styles.radioCard} data-selected={borrower === 'mine'}>
            <input
              type="radio"
              name="kiva-borrower"
              value="mine"
              checked={borrower === 'mine'}
              onChange={() => setBorrower('mine')}
            />
            <span className={styles.radioCardLabel}>I have someone in mind</span>
          </label>
          <label className={styles.radioCard} data-selected={borrower === 'couple'}>
            <input
              type="radio"
              name="kiva-borrower"
              value="couple"
              checked={borrower === 'couple'}
              onChange={() => setBorrower('couple')}
            />
            <span className={styles.radioCardLabel}>
              Let Levi &amp; Meghan choose
            </span>
          </label>
        </fieldset>

        {borrower === 'mine' ? (
          <>
            <p className={styles.helperPalm}>
              Browse Kiva to find a borrower, copy their page URL, and paste it
              below.
            </p>
            <a
              className={styles.helperLink}
              href="https://www.kiva.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Browse Kiva &rarr;
            </a>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={referenceUrlId}>
                Borrower&rsquo;s Kiva URL (paste here)
              </label>
              <input
                id={referenceUrlId}
                className={styles.input}
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://www.kiva.org/lend/..."
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
              />
            </div>
          </>
        ) : (
          <p className={styles.helperMuted}>
            We&rsquo;ll select a borrower and lend in your name after the wedding.
          </p>
        )}

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
        </>
      )}
    </Modal>
  );
}

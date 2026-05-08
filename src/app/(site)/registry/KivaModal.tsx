'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';
import { createCheckoutSession } from '@/src/app/actions/createCheckoutSession';
import Modal from './Modal';
import styles from './forms.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
};

type BorrowerChoice = 'mine' | 'couple';

const STRIPE_PERCENT_FEE = 0.029;
const STRIPE_FIXED_FEE_CENTS = 30;
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function parseDollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/[$,]/g, '');
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const cents = Math.round(parseFloat(trimmed) * 100);
  return cents > 0 ? cents : null;
}

function chargedCents(amountCents: number): number {
  return Math.round((amountCents + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENT_FEE));
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function KivaModal({ open, onClose, returnFocusTo }: Props) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const amountId = useId();
  const messageId = useId();
  const referenceUrlId = useId();
  const errorId = useId();

  const [borrower, setBorrower] = useState<BorrowerChoice>('mine');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [coverFee, setCoverFee] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = useMemo(() => parseDollarsToCents(amount), [amount]);
  const previewCharged = amountCents != null ? chargedCents(amountCents) : null;

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
    if (!email.trim()) {
      setError('Please enter your email.');
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
      email: email.trim(),
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
    <Modal open={open} onClose={onClose} titleId={titleId} returnFocusTo={returnFocusTo}>
      <p className={styles.eyebrow}>Levi&rsquo;s pick</p>
      <h2 id={titleId} className={styles.heading}>
        Kiva
      </h2>
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
            <p className={styles.helperTeal}>
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
            onChange={(e) => setEmail(e.target.value)}
          />
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
          <span>Cover the processing fee</span>
        </label>
        {coverFee && previewCharged != null && amountCents != null ? (
          <p className={styles.feeReadout}>
            Your card will be charged {USD.format(previewCharged / 100)} so we
            receive {USD.format(amountCents / 100)}.
          </p>
        ) : null}

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
            <span>Continue to Payment</span>
          )}
        </button>
      </form>
    </Modal>
  );
}

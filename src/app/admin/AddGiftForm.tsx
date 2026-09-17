'use client';

import { useId, useRef, useState } from 'react';

import { addOfflineGift } from '@/src/app/actions/addOfflineGift';
import type { Fund, OfflineMethod, PartyOption } from './types';
import { fundLabel } from './format';
import { FUND_ORDER } from '@/src/lib/contributionTotals';
import styles from './AddGiftForm.module.css';

const NOTE_MAX = 500;

const METHODS: { id: OfflineMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'check', label: 'Check' },
];

type FieldErrors = {
  party?: string;
  fund?: string;
  amount?: string;
  method?: string;
  note?: string;
};

/* Dollars typed by an admin → integer cents. A dollar sign and thousands
   separators are stripped because a person pasting "$1,250.00" out of a
   bank statement means the same thing as typing 1250. Everything after
   that has to be a plain decimal with at most two places: a third place
   would be silently rounded away, which is the wrong thing to do with
   somebody's gift. */
function parseAmountCents(raw: string): { cents: number } | { error: string } {
  const cleaned = raw.trim().replace(/^\$/, '').replace(/,/g, '').trim();
  if (cleaned === '') return { error: 'Enter a gift amount.' };
  if (/^\d+\.\d{3,}$/.test(cleaned)) {
    return { error: 'Use at most two decimal places.' };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return { error: 'Enter a dollar amount, like 250 or 250.50.' };
  }
  const cents = Math.round(Number(cleaned) * 100);
  if (!Number.isInteger(cents) || cents <= 0) {
    return { error: 'Enter an amount greater than zero.' };
  }
  return { cents };
}

export default function AddGiftForm({
  parties,
  onAdded,
}: {
  parties: PartyOption[];
  onAdded: () => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);

  const [partyId, setPartyId] = useState('');
  const [fund, setFund] = useState<'' | Fund>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'' | OfflineMethod>('');
  const [note, setNote] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /* The Party select is the field focus returns to after a save. It can
     remount during the same state change that clears the form, so the
     focus call is deferred a frame rather than issued against the node
     that is about to be replaced. */
  const partyRef = useRef<HTMLSelectElement | null>(null);

  const ids = {
    form: `${uid}-form`,
    party: `${uid}-party`,
    partyError: `${uid}-party-error`,
    fund: `${uid}-fund`,
    fundError: `${uid}-fund-error`,
    amount: `${uid}-amount`,
    amountError: `${uid}-amount-error`,
    methodError: `${uid}-method-error`,
    note: `${uid}-note`,
    noteCount: `${uid}-note-count`,
    noteError: `${uid}-note-error`,
  };

  function resetFields() {
    setPartyId('');
    setFund('');
    setAmount('');
    setMethod('');
    setNote('');
    setErrors({});
    setServerError(null);
  }

  function onCancel() {
    resetFields();
    setSaved(false);
    setOpen(false);
  }

  function onToggle() {
    if (open) {
      onCancel();
      return;
    }
    setOpen(true);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setSaved(false);
    setServerError(null);

    const next: FieldErrors = {};
    if (!partyId) next.party = 'Choose the party this gift came from.';
    if (!fund) next.fund = 'Choose a fund.';

    const parsed = parseAmountCents(amount);
    if ('error' in parsed) next.amount = parsed.error;

    if (!method) next.method = 'Choose cash or check.';
    if (note.length > NOTE_MAX) {
      next.note = `Keep the note to ${NOTE_MAX} characters or fewer.`;
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || 'error' in parsed) return;

    setPending(true);
    try {
      const result = await addOfflineGift({
        partyId,
        fund: fund as Fund,
        amountCents: parsed.cents,
        method: method as OfflineMethod,
        note: note.trim() === '' ? undefined : note.trim(),
      });
      if ('error' in result) {
        setServerError(result.error);
        return;
      }
      resetFields();
      setSaved(true);
      onAdded();
      requestAnimationFrame(() => partyRef.current?.focus());
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Could not record the gift.',
      );
    } finally {
      setPending(false);
    }
  }

  const remaining = NOTE_MAX - note.length;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.disclosure}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={ids.form}
      >
        {/* The label stays "Add gift" open or closed: aria-expanded is
            what carries the state, and a disclosure whose accessible
            name changes under the user is a name they cannot refer
            back to. */}
        Add gift
      </button>

      {open ? (
        <form
          id={ids.form}
          className={styles.form}
          onSubmit={onSubmit}
          noValidate
        >
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={ids.party}>
              Party
            </label>
            <select
              id={ids.party}
              ref={partyRef}
              className={styles.select}
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              disabled={pending}
              aria-invalid={errors.party ? true : undefined}
              aria-describedby={errors.party ? ids.partyError : undefined}
            >
              <option value="">Choose a party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.party_name}
                </option>
              ))}
            </select>
            {errors.party ? (
              <p className={styles.fieldError} id={ids.partyError} role="alert">
                {errors.party}
              </p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={ids.fund}>
              Fund
            </label>
            <select
              id={ids.fund}
              className={styles.select}
              value={fund}
              onChange={(e) => setFund(e.target.value as '' | Fund)}
              disabled={pending}
              aria-invalid={errors.fund ? true : undefined}
              aria-describedby={errors.fund ? ids.fundError : undefined}
            >
              <option value="">Choose a fund</option>
              {FUND_ORDER.map((f) => (
                <option key={f} value={f}>
                  {fundLabel(f)}
                </option>
              ))}
            </select>
            {errors.fund ? (
              <p className={styles.fieldError} id={ids.fundError} role="alert">
                {errors.fund}
              </p>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor={ids.amount}>
              Amount
            </label>
            <div className={styles.amountWrap}>
              <input
                id={ids.amount}
                className={`${styles.input} ${styles.amountInput}`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={pending}
                aria-invalid={errors.amount ? true : undefined}
                aria-describedby={errors.amount ? ids.amountError : undefined}
              />
            </div>
            {errors.amount ? (
              <p
                className={styles.fieldError}
                id={ids.amountError}
                role="alert"
              >
                {errors.amount}
              </p>
            ) : null}
          </div>

          <fieldset
            className={styles.methodSet}
            aria-invalid={errors.method ? true : undefined}
            aria-describedby={errors.method ? ids.methodError : undefined}
          >
            <legend className={styles.legend}>Method</legend>
            <div className={styles.methodRow}>
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={styles.methodPill}
                  data-selected={method === m.id}
                >
                  <input
                    type="radio"
                    name={`${uid}-method`}
                    className={styles.radio}
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    disabled={pending}
                  />
                  <span className={styles.methodLabel}>{m.label}</span>
                </label>
              ))}
            </div>
            {errors.method ? (
              <p
                className={styles.fieldError}
                id={ids.methodError}
                role="alert"
              >
                {errors.method}
              </p>
            ) : null}
          </fieldset>

          <div className={`${styles.fieldGroup} ${styles.noteGroup}`}>
            <label className={styles.label} htmlFor={ids.note}>
              Note
            </label>
            <textarea
              id={ids.note}
              className={styles.textarea}
              value={note}
              maxLength={NOTE_MAX}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              disabled={pending}
              aria-invalid={errors.note ? true : undefined}
              aria-describedby={
                errors.note ? `${ids.noteCount} ${ids.noteError}` : ids.noteCount
              }
            />
            <p className={styles.counter} id={ids.noteCount}>
              {remaining} characters remaining
            </p>
            {errors.note ? (
              <p className={styles.fieldError} id={ids.noteError} role="alert">
                {errors.note}
              </p>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.save} disabled={pending}>
              {pending ? 'Saving…' : 'Save gift'}
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </button>
          </div>

          {serverError ? (
            <p className={styles.formError} role="alert">
              {serverError}
            </p>
          ) : null}

          <p className={styles.status} role="status" aria-live="polite">
            {saved ? 'Gift saved.' : ''}
          </p>
        </form>
      ) : null}
    </div>
  );
}

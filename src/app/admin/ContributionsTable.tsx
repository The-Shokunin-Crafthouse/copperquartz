'use client';

import { useState } from 'react';
import { exportContributionsCSV } from '@/src/app/actions/exportContributionsCSV';
import type { Contribution } from './types';
import { fundLabel, formatUsd, formatTimestamp, truncate } from './format';
import styles from './ContributionsTable.module.css';

const URL_MAX = 30;
const MESSAGE_MAX = 60;

function downloadFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `contributions-${y}-${m}-${day}.csv`;
}

export default function ContributionsTable({ rows }: { rows: Contribution[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const result = await exportContributionsCSV();
      if ('error' in result) {
        setError(result.error);
        return;
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.exportBtn}
          onClick={onExport}
          disabled={busy}
        >
          {busy ? 'Preparing…' : 'Export CSV'}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Fund</th>
              <th>Amount</th>
              <th>Message</th>
              <th>Borrower URL</th>
              <th>Source</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  No contributions yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{fundLabel(row.fund)}</td>
                  <td className={styles.amountCol}>{formatUsd(row.amount_cents)}</td>
                  <td>
                    {row.message ? (
                      <span title={row.message}>
                        {truncate(row.message, MESSAGE_MAX)}
                      </span>
                    ) : (
                      <span className={styles.dash}>—</span>
                    )}
                  </td>
                  <td>
                    {row.reference_url ? (
                      <a
                        className={styles.link}
                        href={row.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={row.reference_url}
                      >
                        {truncate(row.reference_url, URL_MAX)}
                      </a>
                    ) : (
                      <span className={styles.dash}>—</span>
                    )}
                  </td>
                  <td>
                    {row.self_reported ? (
                      <span className={`${styles.badge} ${styles.badgeSelf}`}>
                        Self-reported
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeStripe}`}>
                        Stripe
                      </span>
                    )}
                  </td>
                  <td className={styles.dateCol}>{formatTimestamp(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

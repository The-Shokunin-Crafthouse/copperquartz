'use client';

import { useState } from 'react';
import { exportRsvpCSV } from '@/src/app/actions/exportRsvpCSV';
import styles from './ContributionsTable.module.css';

function downloadFilename(): string {
  return `rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`;
}

export default function RsvpExportButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const result = await exportRsvpCSV();
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
          {busy ? 'Preparing…' : 'Export Full RSVP CSV'}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </>
  );
}

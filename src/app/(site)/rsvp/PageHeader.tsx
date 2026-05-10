import {
  WEDDING_DATE_ROMAN,
  WEDDING_LOCATION,
  countdownLabel,
  daysUntilWedding,
} from './dateHeader';
import styles from './rsvp.module.css';

export default function PageHeader() {
  const days = daysUntilWedding();
  const label = countdownLabel(days);
  const segments = [WEDDING_DATE_ROMAN, label, WEDDING_LOCATION].filter(
    (s): s is string => Boolean(s),
  );

  return (
    <header className={styles.header}>
      <h1 className={styles.heading}>RSVP</h1>
      <p className={styles.subline}>
        {segments.map((seg, i) => (
          <span key={seg} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span>{seg}</span>
            {i < segments.length - 1 && <span aria-hidden className={styles.sublinePillar} />}
          </span>
        ))}
      </p>
    </header>
  );
}

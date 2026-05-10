'use client';

import styles from '../rsvp.module.css';

export default function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div
      className={styles.indicator}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Step ${current} of ${total}`}
    >
      {dots.map((n) => (
        <span
          key={n}
          className={styles.indicatorDot}
          data-active={n === current ? 'true' : 'false'}
          data-complete={n < current ? 'true' : 'false'}
          aria-hidden
        />
      ))}
    </div>
  );
}

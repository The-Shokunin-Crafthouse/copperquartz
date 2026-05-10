import type { BeverageBreakdownRow } from '@/src/app/actions/getAdminRsvpSummary';
import pageStyles from './page.module.css';
import styles from './ContributionsTable.module.css';

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function BeverageBreakdownTable({
  breakdown,
}: {
  breakdown: BeverageBreakdownRow[];
}) {
  return (
    <section
      className={pageStyles.section}
      aria-labelledby="beverage-breakdown-heading"
    >
      <h2
        id="beverage-breakdown-heading"
        className={pageStyles.sectionHeading}
      >
        Beverage Breakdown
      </h2>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Drink</th>
              <th>Selection</th>
              <th style={{ textAlign: 'right' }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.empty}>
                  No beverage responses yet.
                </td>
              </tr>
            ) : (
              breakdown.map((row, idx) => (
                <tr key={`${row.category}-${row.selection ?? ''}-${idx}`}>
                  <td>{capitalize(row.category)}</td>
                  <td>
                    {row.selection ? (
                      row.selection
                    ) : (
                      <span className={styles.dash}>—</span>
                    )}
                  </td>
                  <td
                    className={styles.amountCol}
                    style={{ textAlign: 'right' }}
                  >
                    {row.count}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

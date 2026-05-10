import type { SpecialRequest } from '@/src/app/actions/getAdminRsvpSummary';
import pageStyles from './page.module.css';
import styles from './ContributionsTable.module.css';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

export default function SpecialRequestsTable({
  requests,
}: {
  requests: SpecialRequest[];
}) {
  return (
    <section
      className={pageStyles.section}
      aria-labelledby="special-requests-heading"
    >
      <h2 id="special-requests-heading" className={pageStyles.sectionHeading}>
        Special Requests &amp; Notes
      </h2>

      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Party</th>
              <th>Note</th>
              <th>Last Edited By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  No special requests yet.
                </td>
              </tr>
            ) : (
              requests.map((req, idx) => (
                <tr key={`${req.party_name}-${req.updated_at}-${idx}`}>
                  <td>{req.party_name}</td>
                  <td>{req.notes}</td>
                  <td>
                    {req.last_edited_by_first_name ? (
                      req.last_edited_by_first_name
                    ) : (
                      <span className={styles.dash}>—</span>
                    )}
                  </td>
                  <td className={styles.dateCol}>
                    {formatDate(req.updated_at)}
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

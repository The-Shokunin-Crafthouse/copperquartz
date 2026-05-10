import type { DecliningGuest } from '@/src/app/actions/getAdminRsvpSummary';
import { formatTimestamp } from './format';
import styles from './ContributionsTable.module.css';

export default function DeclinedGuestsTable({
  guests,
}: {
  guests: DecliningGuest[];
}) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Guest Name</th>
            <th>Party</th>
            <th>Accommodation Notes</th>
            <th>Responded At</th>
          </tr>
        </thead>
        <tbody>
          {guests.length === 0 ? (
            <tr>
              <td colSpan={4} className={styles.empty}>
                No declines yet.
              </td>
            </tr>
          ) : (
            guests.map((g) => (
              <tr key={g.guest_id}>
                <td>{g.full_name}</td>
                <td>{g.party_name}</td>
                <td>
                  {g.accommodation_notes ? (
                    g.accommodation_notes
                  ) : (
                    <span className={styles.dash}>—</span>
                  )}
                </td>
                <td className={styles.dateCol}>
                  {formatTimestamp(g.responded_at)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

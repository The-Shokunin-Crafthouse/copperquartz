import {
  getAdminRsvpSummary,
  type AdminRsvpSummary,
} from '@/src/app/actions/getAdminRsvpSummary';
import { loadContributions } from '@/src/lib/loadContributions';
import AdminDashboard from './AdminDashboard';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

const EMPTY_RSVP_SUMMARY: AdminRsvpSummary = {
  total_invited: 0,
  attending_count: 0,
  declining_count: 0,
  awaiting_count: 0,
  monday_count: 0,
  transport_count: 0,
  transport_party_count: 0,
  attending_guests: [],
  declining_guests: [],
  beverage_breakdown: [],
  special_requests: [],
};

export default async function AdminPage() {
  /* The contributions loader is shared with the CSV export, so the table,
     the totals cards and the downloaded file are all reading one query
     and one set of migration-tolerance rules. */
  const [contributionsResult, rsvpResult] = await Promise.all([
    loadContributions(),
    getAdminRsvpSummary(),
  ]);

  const contributions = contributionsResult.ok ? contributionsResult.rows : [];
  const parties = contributionsResult.ok ? contributionsResult.parties : [];
  const rsvpSummary = rsvpResult.ok ? rsvpResult.data : EMPTY_RSVP_SUMMARY;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Copper &amp; Quartz</p>
        <h1 className={styles.heading}>Admin</h1>
      </header>

      {contributionsResult.ok ? null : (
        <p className={styles.fetchError}>
          Could not load contributions: {contributionsResult.error}
        </p>
      )}
      {rsvpResult.ok ? null : (
        <p className={styles.fetchError}>
          Could not load RSVP summary: {rsvpResult.error}
        </p>
      )}

      <AdminDashboard
        contributions={contributions}
        summary={rsvpSummary}
        parties={parties}
      />
    </div>
  );
}

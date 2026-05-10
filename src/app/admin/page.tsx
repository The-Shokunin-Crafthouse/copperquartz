/* TODO(admin-redesign): revert this whole file to its previous state
   before merging the PR. Currently short-circuited to render dummy
   fixtures for the Vercel preview review session — the original page
   wired up Supabase fetches via fetchContributions() and
   getAdminRsvpSummary(). A `git revert` of the dummy-data commit
   restores the production behaviour cleanly. */
import AdminDashboard from './AdminDashboard';
import {
  DUMMY_CONTRIBUTIONS,
  DUMMY_RSVP_SUMMARY,
} from './dummyAdminData';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Copper &amp; Quartz</p>
        <h1 className={styles.heading}>Admin</h1>
      </header>

      <AdminDashboard
        contributions={DUMMY_CONTRIBUTIONS}
        summary={DUMMY_RSVP_SUMMARY}
      />
    </div>
  );
}

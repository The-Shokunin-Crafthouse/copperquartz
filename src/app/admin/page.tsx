import { createServiceClient } from '@/src/lib/supabase/server';
import {
  getAdminRsvpSummary,
  type AdminRsvpSummary,
} from '@/src/app/actions/getAdminRsvpSummary';
import SummaryCards from './SummaryCards';
import ContributionsTable from './ContributionsTable';
import RsvpSummaryCards from './RsvpSummaryCards';
import DeclinedGuestsTable from './DeclinedGuestsTable';
import RsvpExportButton from './RsvpExportButton';
import AdminStatRow from './AdminStatRow';
import BeverageBreakdownTable from './BeverageBreakdownTable';
import SpecialRequestsTable from './SpecialRequestsTable';
import type { Contribution } from './types';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type FetchResult =
  | { ok: true; rows: Contribution[] }
  | { ok: false; error: string };

async function fetchContributions(): Promise<FetchResult> {
  /* Preview deploys and the snapshot harness run without Supabase env
     vars. Treat the missing-config case as a clean empty state so the
     dashboard renders for visual review without a noisy error banner. */
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, rows: [] };
  }
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('contributions')
      .select(
        'id, name, email, fund, amount_cents, gift_cents, message, reference_url, lenders_choice, self_reported, stripe_session_id, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('admin fetchContributions failed:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true, rows: (data ?? []) as Contribution[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('admin fetchContributions threw:', err);
    return { ok: false, error: message };
  }
}

const EMPTY_RSVP_SUMMARY: AdminRsvpSummary = {
  total_invited: 0,
  attending_count: 0,
  monday_count: 0,
  transport_count: 0,
  declining_guests: [],
  beverage_breakdown: [],
  special_requests: [],
};

export default async function AdminPage() {
  const [contributionsResult, rsvpResult] = await Promise.all([
    fetchContributions(),
    getAdminRsvpSummary(),
  ]);

  const rows = contributionsResult.ok ? contributionsResult.rows : [];
  const rsvpSummary = rsvpResult.ok ? rsvpResult.data : EMPTY_RSVP_SUMMARY;

  return (
    <article>
      <p className={styles.eyebrow}>Copper & Quartz</p>
      <h1 className={styles.heading}>Admin</h1>

      <section className={styles.section} aria-labelledby="contributions-heading">
        <h2 id="contributions-heading" className={styles.sectionHeading}>
          Contributions
        </h2>

        {contributionsResult.ok ? null : (
          <p className={styles.fetchError}>
            Could not load contributions: {contributionsResult.error}
          </p>
        )}

        <SummaryCards rows={rows} />
        <ContributionsTable rows={rows} />
      </section>

      <section className={styles.section} aria-labelledby="rsvp-heading">
        <h2 id="rsvp-heading" className={styles.sectionHeading}>
          RSVPs
        </h2>

        {rsvpResult.ok ? null : (
          <p className={styles.fetchError}>
            Could not load RSVP summary: {rsvpResult.error}
          </p>
        )}

        <RsvpSummaryCards summary={rsvpSummary} />
        <RsvpExportButton />
        <DeclinedGuestsTable guests={rsvpSummary.declining_guests} />
      </section>

      <AdminStatRow
        mondayCount={rsvpSummary.monday_count}
        transportCount={rsvpSummary.transport_count}
      />
      <BeverageBreakdownTable breakdown={rsvpSummary.beverage_breakdown} />
      <SpecialRequestsTable requests={rsvpSummary.special_requests} />
    </article>
  );
}

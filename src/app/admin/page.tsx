import { createServiceClient } from '@/src/lib/supabase/server';
import {
  getAdminRsvpSummary,
  type AdminRsvpSummary,
} from '@/src/app/actions/getAdminRsvpSummary';
import AdminDashboard from './AdminDashboard';
import type { Contribution } from './types';
/* TODO(admin-redesign): revert the dummyAdminData import + the two
   missing-Supabase branches below before merging this PR. The fixtures
   are only there so the Vercel preview renders populated tables for
   visual review — production has Supabase env vars and never hits this
   branch. */
import {
  DUMMY_CONTRIBUTIONS,
  DUMMY_RSVP_SUMMARY,
} from './dummyAdminData';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

type FetchResult =
  | { ok: true; rows: Contribution[] }
  | { ok: false; error: string };

async function fetchContributions(): Promise<FetchResult> {
  /* Preview deploys and the snapshot harness run without Supabase env
     vars. Returning DUMMY_CONTRIBUTIONS lets the preview Vercel build
     show populated tables for design review. Revert to `rows: []`
     before merging — see TODO(admin-redesign) at the top of the file. */
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, rows: DUMMY_CONTRIBUTIONS };
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
  declining_count: 0,
  awaiting_count: 0,
  monday_count: 0,
  transport_count: 0,
  transport_party_count: 0,
  declining_guests: [],
  beverage_breakdown: [],
  special_requests: [],
};

export default async function AdminPage() {
  const [contributionsResult, rsvpResult] = await Promise.all([
    fetchContributions(),
    getAdminRsvpSummary(),
  ]);

  /* Same review-only override as fetchContributions: when Supabase env
     vars are missing, swap in DUMMY_RSVP_SUMMARY so the Vercel preview
     renders populated cards/tables. Production has the env vars and
     never hits this branch. Revert before merging. */
  const supabaseConfigured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const contributions = contributionsResult.ok ? contributionsResult.rows : [];
  const rsvpSummary = !supabaseConfigured
    ? DUMMY_RSVP_SUMMARY
    : rsvpResult.ok
      ? rsvpResult.data
      : EMPTY_RSVP_SUMMARY;

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

      <AdminDashboard contributions={contributions} summary={rsvpSummary} />
    </div>
  );
}

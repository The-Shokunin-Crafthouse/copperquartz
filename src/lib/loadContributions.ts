import { createServiceClient } from '@/src/lib/supabase/server';
import type {
  Contribution,
  ContributionSource,
  Fund,
  PartyAddress,
  PartyOption,
} from '@/src/app/admin/types';

/* Server-only. This module reads SUPABASE_SERVICE_ROLE_KEY through
   createServiceClient and must never reach a client bundle. The
   `server-only` package is not a dependency of this repo, so the
   guarantee is by convention: import this from server components and
   server actions only. Anything a client component needs from the
   contributions data lives in src/lib/contributionTotals.ts, which is
   pure.

   One loader, three consumers (the dashboard page, the contributions
   export, and whatever reads gifts next), so the migration-tolerance
   below is written once rather than copied into each caller. */

const COLUMNS_WITH_004 =
  'id, name, email, fund, amount_cents, gift_cents, message, reference_url, lenders_choice, self_reported, source, party_id, stripe_session_id, created_at';

/* The column list as it stands before migration 004 is applied: no
   source, no party_id. */
const COLUMNS_LEGACY =
  'id, name, email, fund, amount_cents, gift_cents, message, reference_url, lenders_choice, self_reported, stripe_session_id, created_at';

/* Postgres error codes surfaced verbatim by PostgREST. supabase-js
   resolves a select naming a missing column as { data: null, error } and
   never throws, so these are read off the resolved error object. */
const UNDEFINED_COLUMN = '42703';
const UNDEFINED_TABLE = '42P01';

export type LoadContributionsResult =
  | { ok: true; rows: Contribution[]; parties: PartyOption[] }
  | { ok: false; error: string };

type RawRow = Record<string, unknown>;

type PostgrestErrorish = { code?: string; message?: string } | null;

/* PostgREST does not always populate `code`; on some deployments the
   missing-column case arrives as a plain message. Match both so the
   fallback actually fires. */
function isMissingColumn(error: PostgrestErrorish): boolean {
  if (!error) return false;
  if (error.code === UNDEFINED_COLUMN) return true;
  return /column .+ does not exist/i.test(error.message ?? '');
}

function isMissingTable(error: PostgrestErrorish): boolean {
  if (!error) return false;
  if (error.code === UNDEFINED_TABLE) return true;
  const message = error.message ?? '';
  return (
    /relation .+ does not exist/i.test(message) ||
    /could not find the table/i.test(message)
  );
}

/* createServiceClient() returns an untyped SupabaseClient, so every value
   below arrives as unknown. Read each field explicitly rather than
   casting the row — an `as Contribution[]` here would be an unchecked
   promise that the shapes match. */
function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function int(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function intOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const FUNDS: readonly Fund[] = ['honeymoon', 'kiva', 'howlin-dog'];

function fund(value: unknown): Fund {
  return FUNDS.includes(value as Fund) ? (value as Fund) : 'honeymoon';
}

const SOURCES: readonly ContributionSource[] = [
  'stripe',
  'self-reported',
  'cash',
  'check',
];

/* Post-004 the column is NOT NULL, but a row written by a path that does
   not set it, or a value added to the CHECK constraint before this union,
   must not corrupt the totals. Fall back through the legacy boolean. */
function source(raw: RawRow): ContributionSource {
  const value = raw.source;
  if (SOURCES.includes(value as ContributionSource)) {
    return value as ContributionSource;
  }
  return raw.self_reported === true ? 'self-reported' : 'stripe';
}

function toAddress(raw: RawRow): PartyAddress {
  return {
    street: textOrNull(raw.street),
    apt: textOrNull(raw.apt),
    city: textOrNull(raw.city),
    state: textOrNull(raw.state),
    postal_code: textOrNull(raw.postal_code),
    country: textOrNull(raw.country),
  };
}

/* Warn once per process, not once per dashboard load — a server that is
   simply running ahead of its migration should say so, not shout. */
let warnedNoSourceColumn = false;
let warnedNoAddressTable = false;

export async function loadContributions(): Promise<LoadContributionsResult> {
  /* Preview deploys and the snapshot harness run without Supabase env
     vars. Treat the missing-config case as a clean empty state so the
     dashboard renders for visual review without an error banner. */
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, rows: [], parties: [] };
  }

  try {
    const supabase = createServiceClient();

    const [contribRes, partiesRes, addressRes] = await Promise.all([
      supabase
        .from('contributions')
        .select(COLUMNS_WITH_004)
        .order('created_at', { ascending: false }),
      supabase.from('guest_parties').select('id, party_name'),
      supabase.from('party_addresses').select('*'),
    ]);

    /* Contributions, with the pre-004 fallback. */
    let contribRows: RawRow[];
    let legacyShape = false;

    if (contribRes.error && isMissingColumn(contribRes.error)) {
      legacyShape = true;
      if (!warnedNoSourceColumn) {
        warnedNoSourceColumn = true;
        console.warn(
          'loadContributions: migration 004 is not applied (contributions.source / party_id missing). Falling back to the legacy column list; party links and addresses will read as null.',
        );
      }
      const legacyRes = await supabase
        .from('contributions')
        .select(COLUMNS_LEGACY)
        .order('created_at', { ascending: false });
      if (legacyRes.error) {
        console.error(
          'loadContributions legacy select failed:',
          legacyRes.error,
        );
        return { ok: false, error: legacyRes.error.message };
      }
      contribRows = (legacyRes.data ?? []) as RawRow[];
    } else if (contribRes.error) {
      console.error('loadContributions select failed:', contribRes.error);
      return { ok: false, error: contribRes.error.message };
    } else {
      contribRows = (contribRes.data ?? []) as RawRow[];
    }

    /* Guest parties. A failure here is not tolerable — the party picker
       and the export's Party column both depend on it. */
    if (partiesRes.error) {
      console.error('loadContributions parties select failed:', partiesRes.error);
      return { ok: false, error: partiesRes.error.message };
    }
    const partyRaw = (partiesRes.data ?? []) as RawRow[];
    const parties: PartyOption[] = partyRaw
      .map((p) => ({ id: text(p.id), party_name: text(p.party_name) }))
      .filter((p) => p.id.length > 0)
      .sort((a, b) => a.party_name.localeCompare(b.party_name));
    const partyNameById = new Map(parties.map((p) => [p.id, p.party_name]));

    /* Addresses, with the pre-004 fallback. An absent table is an absent
       address, not a failed dashboard. */
    const addressByParty = new Map<string, PartyAddress>();
    if (addressRes.error) {
      if (isMissingTable(addressRes.error)) {
        if (!warnedNoAddressTable) {
          warnedNoAddressTable = true;
          console.warn(
            'loadContributions: migration 004 is not applied (party_addresses table missing). Treating every mailing address as absent.',
          );
        }
      } else {
        console.error(
          'loadContributions addresses select failed:',
          addressRes.error,
        );
        return { ok: false, error: addressRes.error.message };
      }
    } else {
      for (const raw of (addressRes.data ?? []) as RawRow[]) {
        const partyId = text(raw.party_id);
        if (!partyId) continue;
        addressByParty.set(partyId, toAddress(raw));
      }
    }

    const rows: Contribution[] = contribRows.map((raw) => {
      const partyId = legacyShape ? null : textOrNull(raw.party_id);
      return {
        id: text(raw.id),
        name: text(raw.name),
        email: textOrNull(raw.email),
        fund: fund(raw.fund),
        amount_cents: int(raw.amount_cents),
        gift_cents: intOrNull(raw.gift_cents),
        message: textOrNull(raw.message),
        reference_url: textOrNull(raw.reference_url),
        lenders_choice: raw.lenders_choice === true,
        self_reported: raw.self_reported === true,
        source: source(raw),
        party_id: partyId,
        party_name: partyId ? partyNameById.get(partyId) ?? null : null,
        address: partyId ? addressByParty.get(partyId) ?? null : null,
        stripe_session_id: textOrNull(raw.stripe_session_id),
        created_at: text(raw.created_at),
      };
    });

    /* The database already ordered these; re-sort defensively so the
       legacy and modern paths are guaranteed to agree. */
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return { ok: true, rows, parties };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('loadContributions threw:', err);
    return { ok: false, error: message };
  }
}

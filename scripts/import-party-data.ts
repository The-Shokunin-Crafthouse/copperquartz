/*
 * One-time import: apply the reviewed party matches to the database.
 *
 * Two inputs were produced by a matching pass and reviewed by a human:
 *   secrets/address-party-matches.json      — CSV data row -> guest party
 *   secrets/contribution-party-matches.json — contribution -> guest party
 * Neither file carries any address field; it carries the row NUMBER, and this
 * script re-reads secrets/mailing-addresses.csv to get the address itself. That
 * split is deliberate: the match file can be read, diffed and argued about
 * without a home address being copied into a second place.
 *
 * PRECONDITION: migration 004_party_link_source_addresses.sql must be applied
 * first. It adds contributions.party_id and creates party_addresses. A dry run
 * works before the migration (it touches guest_parties only); --apply does not.
 *
 * Usage:
 *   npm run import:party-data              # dry run, writes nothing
 *   npm run import:party-data -- --apply   # performs the writes
 *
 * Safe to run --apply twice. Addresses upsert on party_id, and the contribution
 * update is scoped to `party_id is null`, so a second run reports 0 changed and
 * can never overwrite a link a human corrected by hand afterwards.
 *
 * Output discipline: this prints counts, party names, envelope names and
 * contribution names ONLY. No street, city, postal code or email is ever
 * written to stdout, including in error paths.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServiceClient } from '../src/lib/supabase/server';

/* tsx transpiles this to CJS, where `import.meta.dirname` is undefined while
   `import.meta.url` is populated — so resolve the directory from the URL, which
   holds under both CJS and real ESM. */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSV_PATH = resolve(REPO_ROOT, 'secrets/mailing-addresses.csv');
const ADDRESS_MATCHES_PATH = resolve(REPO_ROOT, 'secrets/address-party-matches.json');
const CONTRIBUTION_MATCHES_PATH = resolve(REPO_ROOT, 'secrets/contribution-party-matches.json');

const EXPECTED_HEADER = ['name', 'street', 'apt', 'city', 'state', 'zip', 'country'] as const;

/* Postgres "undefined_table". Migration 004 not applied yet. */
const UNDEFINED_TABLE = '42P01';

type MatchStatus = 'matched' | 'ambiguous' | 'unmatched';

type AddressMatch = {
  csv_row: number;
  envelope_name: string;
  status: MatchStatus;
  party_id: string | null;
  party_name: string | null;
  reason: string;
};

type ContributionMatch = {
  contribution_id: string;
  contribution_name: string;
  status: MatchStatus;
  party_id: string | null;
  party_name: string | null;
  reason: string;
};

type AddressRow = {
  party_id: string;
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

/* A Supabase error as supabase-js reports it. Narrowed by hand rather than
   imported, so this script does not depend on the client's generic plumbing. */
type SupabaseErrorish = { code?: string; message: string };

function die(reason: string): never {
  console.error(`[import-party-data] REFUSING: ${reason}`);
  process.exit(1);
}

function failOn(context: string, error: SupabaseErrorish): never {
  console.error(
    `[import-party-data] ${context} failed — code=${error.code ?? '(none)'} message=${error.message}`,
  );
  process.exit(1);
}

/* ---------------------------------------------------------------- CSV parse */

/* RFC 4180. A field may be double-quoted; inside quotes a comma and a newline
   are literal and "" is one literal quote. Written inline rather than pulled
   from a dependency because exactly two rows in this file depend on it: both
   carry a comma inside the quoted name field, and a naive split(',') shifts
   every later column on those rows without raising anything. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  /* Strip a UTF-8 BOM: it would otherwise become part of the first header. */
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      endField();
      i += 1;
      continue;
    }
    if (ch === '\r') {
      /* CRLF or a lone CR both terminate the row. */
      endRow();
      i += text[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    if (ch === '\n') {
      endRow();
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (inQuotes) {
    throw new Error('CSV ends inside an unterminated quoted field');
  }
  /* Only emit a trailing row if the file did not end on a newline. */
  if (field.length > 0 || row.length > 0) endRow();

  return rows;
}

/* An empty CSV cell is an absent value, not an empty string. party_addresses
   allows null in every field; storing '' would make "no apartment" and
   "apartment named empty string" indistinguishable to every later reader. */
function orNull(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

/* ------------------------------------------------------------- input guards */

function assertSecretsIgnored(): void {
  try {
    execFileSync('git', ['check-ignore', 'secrets/'], {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    die(
      'secrets/ is not gitignored — refusing to read personal data from a directory git would track',
    );
  }
}

function readJsonFile<T>(path: string, label: string): T {
  if (!existsSync(path)) die(`${label} is missing`);
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (err) {
    die(`${label} is not valid JSON (${err instanceof Error ? err.message : String(err)})`);
  }
}

/* ---------------------------------------------------------------- main flow */

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const unknown = args.filter((a) => a !== '--apply');
  if (unknown.length > 0) die(`unknown argument(s): ${unknown.join(' ')}`);
  const apply = args.includes('--apply');

  console.log(
    `[import-party-data] mode: ${apply ? 'APPLY (writes)' : 'DRY RUN (no writes — pass --apply to write)'}`,
  );

  assertSecretsIgnored();
  if (!existsSync(CSV_PATH)) die('secrets/mailing-addresses.csv is missing');

  const addressMatches = readJsonFile<AddressMatch[]>(
    ADDRESS_MATCHES_PATH,
    'secrets/address-party-matches.json',
  );
  const contributionMatches = readJsonFile<ContributionMatch[]>(
    CONTRIBUTION_MATCHES_PATH,
    'secrets/contribution-party-matches.json',
  );
  if (!Array.isArray(addressMatches)) die('address-party-matches.json is not an array');
  if (!Array.isArray(contributionMatches)) die('contribution-party-matches.json is not an array');

  /* --- parse and align the CSV --------------------------------------- */

  const allRows = parseCsv(readFileSync(CSV_PATH, 'utf8')).filter(
    (r) => !(r.length === 1 && r[0].trim() === ''),
  );
  if (allRows.length === 0) die('secrets/mailing-addresses.csv is empty');

  const header = allRows[0].map((h) => h.trim());
  if (header.join(',') !== EXPECTED_HEADER.join(',')) {
    die(`CSV header is ${header.join(',')} — expected ${EXPECTED_HEADER.join(',')}`);
  }
  const dataRows = allRows.slice(1);

  /* The match file addresses rows by number. If the CSV has gained, lost or
     reordered a row since the matching pass, every number after the change
     points at the wrong household — so the counts must agree before any write,
     and the envelope name is re-checked per row below. */
  if (dataRows.length !== addressMatches.length) {
    die(
      `CSV has ${dataRows.length} data rows but address-party-matches.json has ${addressMatches.length} entries — the match file is stale; re-run the matching pass`,
    );
  }
  console.log(`[import-party-data] CSV data rows: ${dataRows.length} (header excluded)`);

  const badWidth = dataRows.filter((r) => r.length !== EXPECTED_HEADER.length).length;
  if (badWidth > 0) {
    die(`${badWidth} CSV row(s) do not have ${EXPECTED_HEADER.length} fields after a quote-aware parse`);
  }

  /* --- build the address rows ---------------------------------------- */

  const addressRows: AddressRow[] = [];
  const skippedAddresses: { envelope_name: string; status: MatchStatus }[] = [];
  const seenPartyIds = new Set<string>();

  for (const match of addressMatches) {
    const index = match.csv_row - 1;
    if (!Number.isInteger(match.csv_row) || index < 0 || index >= dataRows.length) {
      die(`match entry has csv_row ${match.csv_row}, outside 1..${dataRows.length}`);
    }
    const fields = dataRows[index];

    /* Belt and braces on top of the count check: the row number must still
       point at the household the reviewer looked at. */
    if (fields[0].trim() !== match.envelope_name.trim()) {
      die(
        `CSV row ${match.csv_row} is "${fields[0].trim()}" but the match file expects "${match.envelope_name.trim()}" — row numbering has drifted; re-run the matching pass`,
      );
    }

    if (match.status !== 'matched') {
      skippedAddresses.push({ envelope_name: match.envelope_name, status: match.status });
      continue;
    }
    if (!match.party_id) {
      die(`CSV row ${match.csv_row} ("${match.envelope_name}") is matched but has no party_id`);
    }
    /* party_id is the primary key of party_addresses, so two rows claiming one
       party would silently collapse to whichever the upsert saw last. */
    if (seenPartyIds.has(match.party_id)) {
      die(
        `party "${match.party_name ?? match.party_id}" is claimed by more than one CSV row — party_addresses holds one address per party`,
      );
    }
    seenPartyIds.add(match.party_id);

    addressRows.push({
      party_id: match.party_id,
      street: orNull(fields[1]),
      apt: orNull(fields[2]),
      /* City is imported exactly as written. Several are misspelled; correcting
         them here would put this script in the business of guessing at
         someone's address, and the postal code already routes the envelope. */
      city: orNull(fields[3]),
      state: orNull(fields[4]),
      postal_code: orNull(fields[5]),
      country: orNull(fields[6]),
    });
  }

  /* --- build the contribution updates -------------------------------- */

  const contributionUpdates: { id: string; party_id: string; party_name: string; name: string }[] =
    [];
  const skippedContributions: { contribution_name: string; status: MatchStatus }[] = [];

  for (const match of contributionMatches) {
    if (match.status !== 'matched') {
      skippedContributions.push({
        contribution_name: match.contribution_name,
        status: match.status,
      });
      continue;
    }
    if (!match.party_id) {
      die(`contribution "${match.contribution_name}" is matched but has no party_id`);
    }
    contributionUpdates.push({
      id: match.contribution_id,
      party_id: match.party_id,
      party_name: match.party_name ?? '(unnamed party)',
      name: match.contribution_name,
    });
  }

  console.log(
    `[import-party-data] addresses: ${addressRows.length} to write, ${skippedAddresses.length} skipped`,
  );
  console.log(
    `[import-party-data] contributions: ${contributionUpdates.length} to link, ${skippedContributions.length} skipped`,
  );

  if (skippedAddresses.length > 0) {
    console.log('[import-party-data] addresses NOT imported (need a human decision):');
    for (const s of skippedAddresses) {
      console.log(`    - ${s.envelope_name} [${s.status}]`);
    }
  }
  if (skippedContributions.length > 0) {
    console.log('[import-party-data] contributions NOT linked (need a human decision):');
    for (const s of skippedContributions) {
      console.log(`    - ${s.contribution_name} [${s.status}]`);
    }
  }

  /* --- verify every target party still exists ------------------------ */

  const client = createServiceClient();

  const partyIds = [...new Set([...addressRows.map((r) => r.party_id), ...contributionUpdates.map((c) => c.party_id)])];
  const { data: existingParties, error: partyError } = await client
    .from('guest_parties')
    .select('id, party_name')
    .in('id', partyIds);

  if (partyError) failOn('guest_parties existence check', partyError);

  const foundIds = new Set((existingParties ?? []).map((p) => p.id as string));
  const missing = partyIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    console.error(
      `[import-party-data] ABORT: ${missing.length} party id(s) in the match files no longer exist in guest_parties:`,
    );
    for (const id of missing) console.error(`    - ${id}`);
    process.exit(1);
  }
  console.log(
    `[import-party-data] verified ${partyIds.length}/${partyIds.length} party ids exist in guest_parties`,
  );

  if (!apply) {
    console.log('[import-party-data] DRY RUN complete — nothing was written.');
    console.log(
      '[import-party-data] party_addresses was not queried (migration 004 may not be applied yet).',
    );
    console.log('[import-party-data] re-run with --apply to write, after migration 004 is applied.');
    return;
  }

  /* --- write ---------------------------------------------------------- */

  const { error: upsertError } = await client
    .from('party_addresses')
    .upsert(addressRows, { onConflict: 'party_id' });

  if (upsertError) {
    if (upsertError.code === UNDEFINED_TABLE) {
      die('party_addresses does not exist — apply migration 004 before running with --apply');
    }
    failOn('party_addresses upsert', upsertError);
  }
  console.log(`[import-party-data] upserted ${addressRows.length} address row(s).`);

  /* Scoped to `party_id is null` so a re-run changes nothing, and a link a
     human fixed by hand after the first run is never clobbered. */
  let linked = 0;
  for (const update of contributionUpdates) {
    const { data, error } = await client
      .from('contributions')
      .update({ party_id: update.party_id })
      .eq('id', update.id)
      .is('party_id', null)
      .select('id');

    if (error) failOn(`contributions update for "${update.name}"`, error);

    if ((data ?? []).length > 0) {
      linked += 1;
      console.log(`    linked "${update.name}" -> ${update.party_name}`);
    } else {
      console.log(`    "${update.name}" already linked or absent — left alone`);
    }
  }
  console.log(
    `[import-party-data] contributions changed this run: ${linked} (${contributionUpdates.length - linked} already linked)`,
  );
  if (linked === 0 && contributionUpdates.length > 0) {
    console.log('[import-party-data] idempotent re-run — end state unchanged.');
  }

  /* --- read back ------------------------------------------------------ */

  const { count: addressCount, error: addressCountError } = await client
    .from('party_addresses')
    .select('party_id', { count: 'exact', head: true });
  if (addressCountError) failOn('party_addresses count', addressCountError);

  const { count: linkedCount, error: linkedCountError } = await client
    .from('contributions')
    .select('id', { count: 'exact', head: true })
    .not('party_id', 'is', null);
  if (linkedCountError) failOn('contributions linked count', linkedCountError);

  console.log(`[import-party-data] party_addresses rows now: ${addressCount ?? 0}`);
  console.log(`[import-party-data] contributions with a party_id now: ${linkedCount ?? 0}`);
  console.log('[import-party-data] APPLY complete.');
}

main().catch((err) => {
  console.error('[import-party-data] threw:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

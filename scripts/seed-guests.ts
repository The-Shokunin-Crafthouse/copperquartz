import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import * as XLSX from 'xlsx';
import { createServiceClient } from '../src/lib/supabase/server';

const EXPECTED_HEADERS = ['guest_1', 'guest_2', 'guest_3', 'guest_4', 'guest_5'] as const;

/* Matches any (...) group, anywhere in the cell. Diverges from the original
   spec, which only treated trailing parens as aliases — mid-name forms like
   "Charles (Bud) Bahn" or "Kamala (Kam) Shalhoub" now extract aliases too. */
const PAREN_RE = /\s*\(([^)]+)\)\s*/g;

type ParsedGuest = {
  full_name: string;
  first_name: string;
  last_name: string;
  lookup_aliases: string[];
};

function parseGuestCell(raw: string): ParsedGuest | null {
  const cell = raw.trim();
  if (!cell) return null;

  const aliases: string[] = [];
  const baseName = cell
    .replace(PAREN_RE, (_, group: string) => {
      for (const a of group.split(',')) {
        const trimmed = a.trim().toLowerCase();
        if (trimmed) aliases.push(trimmed);
      }
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();

  if (!baseName) return null;

  const lastSpace = baseName.lastIndexOf(' ');
  let first_name: string;
  let last_name: string;
  if (lastSpace === -1) {
    first_name = baseName;
    last_name = baseName;
  } else {
    first_name = baseName.slice(0, lastSpace).trim();
    last_name = baseName.slice(lastSpace + 1).trim();
  }

  return { full_name: baseName, first_name, last_name, lookup_aliases: aliases };
}

function canonicalHash(guests: ParsedGuest[]): string {
  const joined = guests
    .map((g) => g.full_name.trim().toLowerCase())
    .sort()
    .join('|');
  return createHash('sha256').update(joined).digest('hex').slice(0, 16);
}

function derivePartyName(guests: ParsedGuest[]): string {
  if (guests.length === 1) return guests[0].full_name;
  const lastNames = new Set(guests.map((g) => g.last_name.toLowerCase()));
  if (lastNames.size === 1) {
    const firsts = guests.map((g) => g.first_name).join(' & ');
    return `${firsts} ${guests[0].last_name}`;
  }
  return guests.map((g) => g.full_name).join(' & ');
}

async function main() {
  const xlsxPath = resolve(process.cwd(), 'guest-list.xlsx');
  if (!existsSync(xlsxPath)) {
    console.error(`File not found: ${xlsxPath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: '' });

  if (rows.length === 0) {
    console.error('Sheet is empty');
    process.exit(1);
  }

  const header = (rows[0] as unknown[]).slice(0, 5).map((h) => String(h).trim());
  const headersOk =
    header.length === EXPECTED_HEADERS.length &&
    header.every((h, i) => h === EXPECTED_HEADERS[i]);
  if (!headersOk) {
    console.error(`Invalid header row. Expected: ${JSON.stringify(EXPECTED_HEADERS)}`);
    console.error(`Got: ${JSON.stringify(header)}`);
    process.exit(1);
  }

  const supabase = createServiceClient();

  let partiesCreated = 0;
  let partiesSkipped = 0;
  let guestsCreated = 0;
  let guestsSkipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const guests: ParsedGuest[] = [];
    for (let c = 0; c < 5; c++) {
      const cell = row[c];
      if (cell == null) continue;
      const parsed = parseGuestCell(String(cell));
      if (parsed) guests.push(parsed);
    }
    if (guests.length === 0) continue;

    const hash = canonicalHash(guests);
    const partyName = derivePartyName(guests);

    const { data: existingParty, error: lookupErr } = await supabase
      .from('guest_parties')
      .select('id, party_name')
      .eq('canonical_hash', hash)
      .maybeSingle();
    if (lookupErr) throw lookupErr;

    if (existingParty) {
      partiesSkipped++;
      console.log(`[row ${i}] skipped party "${existingParty.party_name}" (${guests.length} guests)`);
      continue;
    }

    const { data: newParty, error: insertPartyErr } = await supabase
      .from('guest_parties')
      .insert({ party_name: partyName, canonical_hash: hash })
      .select('id, party_name')
      .single();
    if (insertPartyErr) throw insertPartyErr;
    partiesCreated++;
    console.log(`[row ${i}] created party "${newParty.party_name}" (${guests.length} guests)`);

    for (const g of guests) {
      const { data: existingGuest, error: gLookupErr } = await supabase
        .from('guests')
        .select('id')
        .eq('party_id', newParty.id)
        .ilike('full_name', g.full_name)
        .maybeSingle();
      if (gLookupErr) throw gLookupErr;

      if (existingGuest) {
        guestsSkipped++;
        console.log(`  skipped guest "${g.full_name}"`);
        continue;
      }

      const { error: insertGuestErr } = await supabase.from('guests').insert({
        party_id: newParty.id,
        full_name: g.full_name,
        first_name: g.first_name,
        last_name: g.last_name,
        lookup_aliases: g.lookup_aliases.length ? g.lookup_aliases : null,
      });
      if (insertGuestErr) throw insertGuestErr;
      guestsCreated++;
      console.log(`  created guest "${g.full_name}"`);
    }
  }

  console.log(
    `Seeded ${partiesCreated} parties (${partiesSkipped} skipped), ${guestsCreated} guests (${guestsSkipped} skipped)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

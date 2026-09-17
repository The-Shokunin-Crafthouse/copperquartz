# RSVP Page — Build Plan v4
## Levi & Meghan · September 29, 2026 · copperquartz.family

> **Legend**
> - 🧑 **YOU** — Do this yourself
> - 💻 **CLAUDE CODE** — Paste into Claude Code terminal session
> - ✅ **DONE** — Already completed
> - ⏭️ **SKIP** — Already in place from a prior build

---

## Changelog vs v3

- **Hosting moved to Vercel.** All Hostinger Node.js / hPanel restart steps removed. Env vars now live in Vercel Project Settings.
- **New Phase 0 — Pre-flight checks.** v3 assumed a lot of prerequisites; v4 verifies them explicitly before anything else runs.
- **Lookup aliases fixed.** Stored lowercased at seed time so Supabase JS `.contains()` works without raw SQL or RPC functions.
- **Lookup disambiguation.** `lookupParty` prefers exact full-name match. If multiple full-name matches still tie, returns `error: 'ambiguous'` and the UI prompts for the full name.
- **Plural-aware countdown.** "1 day left" not "1 days left." Suppressed entirely once the date has passed.
- **`force-dynamic` on the RSVP route.** Confirmation refresh-safety actually works now.
- **Edit-from-Review split.** Inline edit on Review for booleans (Monday, transport) and the textarea (accommodations). Step-jump with `returnToReview` flag for beverage. Step-jump (no flag) for attendance — natural re-flow lands the user back on Review.
- **Step indicator collapses on skip path.** All-decline → 4 dots, not 7 with three stranded.
- **Server-side coverage validation.** `submitRsvp` rejects payloads that don't cover every guest in the party.
- **Excel header validation.** Seed script exits with a clear error if the header row is malformed.
- **Admin simplified.** v3's 6 summary cards + filterable table replaced with one "RSVPs" card on the contributions row, and a declined-only table underneath. CSV export retained.
- **Daily digest emails (NEW Phase 6).** Resend + Vercel Cron, 7am Mountain Time, skip-if-empty. To Levi + Meghan only; guests get on-screen confirmation, no email.
- **TypeScript types from Supabase (NEW Step 2.0).** Generated via `supabase gen types`. No more `any` in server actions.
- **Pre-mail cleanup (NEW Phase 8).** SQL truncate command to wipe test data the day before Save the Dates ship.

---

## Architecture Decision

**Step-by-step wizard at `/rsvp`.** Same as v2/v3.

---

## Design System Reference

All tokens are already defined in the global stylesheet on copperquartz.family. v4 inherits them — do not redeclare. Full token set is documented in v3 (color, type, space, radius, motion, breakpoints, hairlines, touch targets). Component patterns to inherit: `RSVPButton`, `RegistryButton`, `FAQRow` accordion, `InfoItem` pillar, `PageBackdrop`, palm-break.svg divider.

Verified contrast (computed):
- Brown on bg: 7.4:1 ✓
- Teal on bg: 4.6:1 ✓ AA body
- Palm-leaf on bg: 4.5:1 ✓ AA body
- Coral-rose on bg: 5.9:1 ✓ AA body — **use for errors**
- Terracotta on bg: 3.6:1 ✗ — only for eyebrow labels at 12px, never body
- Bg on palm-leaf: 4.5:1 ✓ AA — CTA button text

---

## PHASE 0 — Pre-flight Checks

Verify each item before proceeding to Phase 1. If a check fails, fix it before moving on.

### 0.1 🧑 YOU — Verify v2/v3 schema is not partially applied

In Supabase SQL Editor:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('guest_parties','guests','rsvp_responses',
                     'rsvp_accommodations','digest_runs');
```

- If zero rows: ✓ proceed.
- If any rows: drop them with `drop table if exists rsvp_accommodations, rsvp_responses, guests, guest_parties, digest_runs cascade;` (no production data exists yet).

### 0.2 🧑 YOU — Verify Vercel environment variables

In **Vercel Dashboard → Project → Settings → Environment Variables**, confirm these exist for both Production and Preview environments:

| Variable | Source |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API (anon/public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (service_role — keep secret) |
| `NEXT_PUBLIC_SITE_URL` | `https://copperquartz.family` |
| `RESEND_API_KEY` | Phase 6.2 — leave for now if not yet created |

Also ensure `.env.local` has the first four locally so the seed script and dev server work. Run:

```bash
grep -E 'SUPABASE_(URL|ANON_KEY|SERVICE_ROLE_KEY)|NEXT_PUBLIC_SITE_URL' .env.local | wc -l
```

Should return `4`. If not, copy values from Vercel into `.env.local`.

### 0.3 ⏭️ SKIP if `lib/supabase/server.ts` exists

Check:
```bash
ls lib/supabase/server.ts 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

If MISSING, create it (Claude Code prompt):

```
Create lib/supabase/server.ts that exports createServiceClient() — uses
SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from process.env, returns a
Supabase client configured with auth: { persistSession: false } and
the service role key. This client bypasses RLS by design and must NEVER
be passed to client components.
```

### 0.4 ⏭️ SKIP if site is already built (it is — copperquartz.family is live)

Verify the global chrome exists locally:

```bash
ls app/\(site\)/layout.tsx components/NavBar/* components/FooterBar/* components/PageBackdrop/* 2>/dev/null
```

Each of these should resolve to actual files. If anything is missing, the RSVP page will render without nav, footer, or backdrop. If you see "MISSING," stop and figure out why before continuing.

### 0.5 ⏭️ SKIP if site is already built

Custom fonts:
```bash
ls public/fonts/ngetic-modern-regular.woff2 public/fonts/hesland-regular.woff2 2>/dev/null
```

Both should exist. The live deployed site loads them, so they should be in your repo.

### 0.6 ⏭️ SKIP if site is already built

Design tokens declared in global CSS:
```bash
grep -l "color-coral-rose" app/globals.css styles/ 2>/dev/null
```

Should return at least one filename. If empty, the tokens aren't where v4 thinks they are — locate them and update the import path in the build prompts.

### 0.7 ⏭️ SKIP if registry build done

Admin route exists:
```bash
ls app/admin/page.tsx
```

If MISSING, the registry build's Phase 4 was never completed. v4's Phase 5 extends `/admin` rather than creating it; if no admin exists, you'll need to build the scaffold first or v4's Phase 5 prompt will fail to find anything to extend.

### 0.8 🧑 YOU — Resend account exists

If you don't have a Resend account, create one now at [resend.com](https://resend.com). Free tier (3,000 emails/month) is plenty.

You'll do the domain verification + API key creation in Phase 6. Just confirm the account exists.

---

## PHASE 1 — Database

### 1.1 🧑 YOU — Run the migration

Supabase SQL Editor → New query → paste and run:

```sql
-- Guest parties (seeded from Excel, never written by guests)
create table guest_parties (
  id uuid default gen_random_uuid() primary key,
  party_name text not null,
  canonical_hash text not null unique,    -- stable identity across seed re-runs
  created_at timestamptz default now()
);

create index guest_parties_hash_idx on guest_parties (canonical_hash);

-- Individual guests within a party
-- lookup_aliases is stored already-lowercased so .contains() works
create table guests (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references guest_parties(id) on delete cascade not null,
  full_name text not null,
  first_name text not null,
  last_name text not null,
  lookup_aliases text[] default '{}',     -- always lowercase
  created_at timestamptz default now()
);

create index guests_first_name_idx on guests (lower(first_name));
create index guests_last_name_idx  on guests (lower(last_name));
create index guests_full_name_idx  on guests (lower(full_name));
create index guests_aliases_idx    on guests using gin (lookup_aliases);

-- One RSVP row per guest. Null on monday/transport/beverage_*
-- means "not applicable" (guest is not attending), not "unanswered"
create table rsvp_responses (
  id uuid default gen_random_uuid() primary key,
  guest_id uuid references guests(id) on delete cascade not null unique,
  attending boolean not null,
  monday_meetup boolean,
  needs_transport boolean,
  beverage_category text check (beverage_category in
    ('cocktails','mocktails','wine','beer','non-alcoholic')),
  beverage_selection text,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index rsvp_responses_updated_at_idx on rsvp_responses (updated_at);

-- One accommodations note per party
create table rsvp_accommodations (
  id uuid default gen_random_uuid() primary key,
  party_id uuid references guest_parties(id) on delete cascade not null unique,
  notes text,
  last_edited_by_guest_id uuid references guests(id) on delete set null,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index rsvp_accommodations_updated_at_idx on rsvp_accommodations (updated_at);

-- Digest runs — log of every successful daily-digest email send
-- Used to determine "what's new since the last digest"
create table digest_runs (
  id uuid default gen_random_uuid() primary key,
  sent_at timestamptz default now() not null,
  responses_included integer not null,
  accommodations_included integer not null
);

create index digest_runs_sent_at_idx on digest_runs (sent_at desc);

-- RLS: NO public policies. All access via service role server actions.
alter table guest_parties       enable row level security;
alter table guests              enable row level security;
alter table rsvp_responses      enable row level security;
alter table rsvp_accommodations enable row level security;
alter table digest_runs         enable row level security;
```

Click **Run**. Verify all five tables in Table Editor.

---

## PHASE 2 — Guest Data + Types

### 2.0 💻 CLAUDE CODE — Generate Supabase TypeScript types

```
Generate TypeScript types from the Supabase schema for this project.

Steps:
1. Install the Supabase CLI if not present:
   npm install -D supabase
2. Find the project ref from .env.local's SUPABASE_URL — the subdomain
   before .supabase.co is the project ref. For example:
   SUPABASE_URL=https://abcdefgh.supabase.co → project ref = abcdefgh
3. Run: npx supabase gen types typescript --project-id <ref> > types/supabase.ts
4. Add an npm script: "types:supabase": "npx supabase gen types typescript --project-id <ref> > types/supabase.ts"
5. Verify the file exists and contains Database type with the five tables
   from Phase 1.

After this, all server actions import from @/types/supabase to type
their queries — no `any`, no `as unknown as`. Studio standard.
```

### 2.1 🧑 YOU — Prepare the Excel file

Create `guest-list.xlsx` in the project root with five columns:

| Column A | Column B | Column C | Column D | Column E |
|---|---|---|---|---|
| `guest_1` | `guest_2` | `guest_3` | `guest_4` | `guest_5` |

**Rules:**
- Row 1 is the header row with these exact names (the seed script validates this).
- Each row is one party.
- Names are full names: `Sarah Kim`, `David Kim`.
- Nicknames go in trailing parens, comma-separated: `Charles Bahn (Chip,Chuck)`. Both `Chip` and `Chuck` will match `Charles` on lookup.
- Leave unused guest columns blank.
- No empty rows between parties.

### 2.2 💻 CLAUDE CODE — Seed script

```
Create a one-time guest-list seeding script for the Levi & Meghan wedding.

File: scripts/seed-guests.ts

Requirements:

HEADER VALIDATION:
- Read the header row first. The header values must be EXACTLY:
  ['guest_1', 'guest_2', 'guest_3', 'guest_4', 'guest_5']
- If any header is missing, misspelled, or different case: log
  a clear error explaining the expected headers, exit code 1.

NAME PARSING:
- Each guest cell may have form: "Full Name" or "Full Name (alias1,alias2)"
- Match aliases ONLY at the end of the cell with regex:
  /^(.+?)\s*\(([^)]+)\)\s*$/
  - Group 1 is the base name. Group 2 is the comma-list of aliases.
  - Trim each alias. Lowercase each alias before storing.
- Names with internal parens (e.g. "Charles (Bud) Bahn") will not match
  the trailing-paren regex and will be treated as plain names. Document
  this behavior in a comment.
- Split base name on the LAST space → first_name, last_name.
- Single-word names: use the word for both fields.

CANONICAL HASH:
- Sort the parsed full_names case-insensitively.
- Lowercase, trim, join with '|'.
- SHA-256 the joined string. Take first 16 hex chars. This is the
  canonical_hash.

PARTY NAME (auto):
- Same last name across all guests → "First1 & First2 LastName"
  (or comma-and-conjunction for 3+ guests).
- Mixed last names → "Full1 & Full2" (or comma-and for 3+).
- Single guest → use their full_name.

UPSERT FLOW:
- Look up guest_parties by canonical_hash. If exists, skip the row
  entirely (already seeded — do not modify).
- Otherwise, insert party with auto party_name + canonical_hash.
- For each guest in the row: look up by (party_id, lower(full_name)).
  Skip if exists; otherwise insert with full_name, first_name,
  last_name, lookup_aliases (already lowercased).

Use lib/supabase/server.ts → createServiceClient() for the DB client.
Use 'xlsx' npm package (npm install xlsx if not present).

Logging:
- Per row: action ('created' | 'skipped'), party_name, guest count.
- Final: "Seeded X parties (Y skipped), Z guests (W skipped)".
- Wrap in try/catch — exit code 1 on failure.

Add npm script: "seed:guests": "npx ts-node scripts/seed-guests.ts"

NOTE: This seed handles initial creation only. Adding/removing a guest
in an already-seeded party changes the canonical_hash and creates a
NEW party — orphaning the original. For roster changes to existing
parties, use manual SQL or a separate update-roster.ts script.
```

### 2.3 🧑 YOU — Run the seed

```bash
npm run seed:guests
```

Verify in Supabase Table Editor:
- `guest_parties` rows have `party_name` and `canonical_hash`.
- `guests` rows have correct `first_name`/`last_name` and `lookup_aliases` arrays (all lowercase).

---

## PHASE 3 — Server Actions

### 3.1 💻 CLAUDE CODE — Six server actions

```
Create six Next.js Server Actions for the RSVP flow.
All use createServiceClient() from lib/supabase/server.ts.
All import types from @/types/supabase. No `any`, no `as unknown as`.
Use 'use server' directive in each file.

---

FILE 1: app/actions/lookupParty.ts

Function:
  lookupParty(name: string):
    Promise<PartyResult | { error: 'no_match' | 'ambiguous' | 'server_error' }>

PartyResult:
  {
    party: { id: string; party_name: string }
    guests: Array<{
      id: string
      full_name: string
      first_name: string
      existing_rsvp: {
        attending: boolean
        monday_meetup: boolean | null
        needs_transport: boolean | null
        beverage_category: string | null
        beverage_selection: string | null
        updated_at: string
      } | null
    }>
    existing_accommodations: {
      notes: string
      last_edited_by_first_name: string | null
      updated_at: string
    } | null
  }

Logic:
  1. Trim + lowercase the input. Reject empty/whitespace → 'no_match'.
  2. Disambiguation order:
     a. Exact full_name match: SELECT * FROM guests WHERE lower(full_name) = $1
        - If exactly 1 row → use it.
        - If multiple rows → return { error: 'ambiguous' }.
     b. If no full_name match, try first_name OR last_name OR aliases:
        SELECT * FROM guests
        WHERE lower(first_name) = $1
           OR lower(last_name) = $1
           OR lookup_aliases @> ARRAY[$1]   -- aliases stored lowercase
        - If exactly 1 row → use it.
        - If multiple rows → return { error: 'ambiguous' }.
        - If 0 rows → return { error: 'no_match' }.
  3. Take the matched guest's party_id, fetch ALL guests in that party.
  4. Left-join rsvp_responses for each guest.
  5. Fetch rsvp_accommodations for the party_id. If a row exists,
     also fetch the first_name of last_edited_by_guest_id.
  6. Wrap all queries in try/catch → on error return 'server_error'.

Use Supabase JS query builder: .eq() for equality, .contains() for
the array-aliases case (stored lowercase, queried lowercase).

---

FILE 2: app/actions/submitRsvp.ts

Function:
  submitRsvp(payload: RsvpPayload):
    Promise<{ success: true; partyId: string } | { error: string }>

RsvpPayload:
  {
    party_id: string
    submitter_guest_id: string
    responses: Array<{
      guest_id: string
      attending: boolean
      monday_meetup?: boolean | null
      needs_transport?: boolean | null
      beverage_category?: string | null
      beverage_selection?: string | null
    }>
    accommodation_notes?: string | null
  }

Validation (reject entire payload on any failure):
  - submitter_guest_id must exist and belong to party_id.
  - Every response.guest_id must exist and belong to party_id.
  - Server fetches all guests for party_id and checks
    responses.length === guests.length AND every guest_id is covered.
    (Prevents partial submissions from a buggy or malicious client.)

Upsert flow:
  - For each response:
      if attending = true:
        upsert with all provided fields + updated_at = now()
      if attending = false:
        upsert with attending = false AND set
          monday_meetup = null,
          needs_transport = null,
          beverage_category = null,
          beverage_selection = null
        (server-authoritative wipe)
      ON CONFLICT (guest_id) DO UPDATE
  - For accommodation_notes:
      if null/empty → set notes = null
      else upsert rsvp_accommodations with:
        notes, last_edited_by_guest_id = submitter_guest_id,
        updated_at = now()
      ON CONFLICT (party_id) DO UPDATE
  - Run upserts sequentially (Supabase JS has no transactions).
    On any error: log full detail server-side, return
    { error: 'submission_failed' } (never expose raw errors).

On success: return { success: true, partyId: party_id }.

---

FILE 3: app/actions/getConfirmationData.ts

Function:
  getConfirmationData(partyId: string):
    Promise<ConfirmationData | { error: 'not_found' | 'server_error' }>

ConfirmationData:
  {
    attending_first_names: string[]
    declining_first_names: string[]
    variant: 'attending' | 'declining'
  }

Logic:
  - Validate partyId is a valid UUID. If not → 'not_found'.
  - Fetch all guests for party_id, left-join rsvp_responses.
  - Sort responded guests by attending true/false.
  - variant = 'declining' iff attending_first_names is empty AND at
    least one declining response exists. Otherwise 'attending'
    (covers pure-attending and mixed cases identically — mixed
    shows the attending-variant heading with only attending names).
  - If zero responses exist for this party at all → 'not_found'.
  - Return only first_names. No other PII.

---

FILE 4: app/actions/exportRsvpCSV.ts

Function:
  exportRsvpCSV(): Promise<{ csv: string } | { error: string }>

CSV columns (in this exact order):
  Guest Name, Party, Attending, Monday Meetup, Needs Transport,
  Beverage Category, Beverage Selection, Party Accommodation Notes,
  Note Last Edited By, Responded At

- Left-join guests → rsvp_responses → guest_parties → rsvp_accommodations.
- Left-join again to resolve last_edited_by_guest_id → first_name.
- Repeat the party-level note + last-edited-by name on every row of that party.
- Booleans: 'Yes' / 'No' / '—' (null = no response).
- Responded At: ISO timestamp, or '—' if null.

---

FILE 5: app/actions/getAdminRsvpSummary.ts

Function:
  getAdminRsvpSummary(): Promise<AdminRsvpSummary>

AdminRsvpSummary:
  {
    total_invited: number          // SELECT count(*) FROM guests
    attending_count: number        // SELECT count(*) WHERE attending = true
    declining_guests: Array<{
      guest_id: string
      full_name: string
      party_name: string
      accommodation_notes: string | null
      responded_at: string         // ISO format
    }>
  }

Logic:
  - total_invited: count of all guests rows.
  - attending_count: count of rsvp_responses where attending = true.
  - declining_guests: guests joined to rsvp_responses (attending = false),
    joined to guest_parties (party_name), left-joined to rsvp_accommodations
    on party_id (notes only).
  - Order declining_guests by responded_at DESC.

---

FILE 6: app/actions/sendRsvpDigest.ts

Function:
  sendRsvpDigest(): Promise<{ sent: boolean; reason?: string }>

Used by the Vercel Cron route (Phase 6.4).

Logic:
  1. Fetch the most recent digest_runs.sent_at. If no row exists,
     treat the cutoff as 30 days ago (handles the very first run).
  2. Query rsvp_responses joined to guests + guest_parties WHERE
     updated_at > cutoff. Order by updated_at ASC.
  3. Query rsvp_accommodations joined to guest_parties WHERE
     updated_at > cutoff. Order by updated_at ASC.
  4. If both queries return zero rows: return { sent: false, reason: 'no_new_rsvps' }
     and do NOT insert a digest_runs row. The cutoff stays where it is.
  5. Otherwise:
     - Build the email HTML (template specified in Phase 6.3).
     - Send via Resend SDK to: levi@levibahn.com, meghancave@yahoo.com
       From: rsvp@levibahn.com (verified domain, see Phase 6.2)
       Reply-To: levi@levibahn.com
       Subject: "RSVP digest — {N} new responses · {date}"
     - On Resend success: insert a digest_runs row with sent_at = now(),
       responses_included = N, accommodations_included = M.
     - On Resend failure: log the error, do NOT insert digest_runs
       (next run will retry from the same cutoff).
     - Return { sent: true }.

Use the Resend SDK: npm install resend (if not present).
RESEND_API_KEY comes from process.env.

This action is callable from a Cron route handler (Phase 6.4) which
authorizes the request via a CRON_SECRET header. No public access.
```

---

## PHASE 4 — RSVP Page Build

### 4.1 💻 CLAUDE CODE — Full wizard build

```
Build the /rsvp page for the Levi & Meghan wedding website.

CRITICAL: Read the global token file (app/globals.css or wherever it
lives — locate first via grep) before writing any markup. Tokens
(--color-*, --space-*, --text-*, --motion-*, --font-*, --height-*,
--radius-*, --border-*) are already declared globally. The RSVP page
MUST NOT redeclare them or use raw px/hex/rgb/ms values that aren't
tokens. Every visual property is a token reference.

Inherit layout shell, NavBar, FooterBar, PageBackdrop from
app/(site)/layout.tsx. The /rsvp route lives inside (site).

=== FILES ===
app/rsvp/page.tsx                   — Server Component. Reads ?confirmation
                                       and either renders Confirmation or
                                       streams in the client wizard.
                                       MUST include: export const dynamic = 'force-dynamic'
app/rsvp/RsvpClient.tsx             — Client Component, wizard orchestrator.
app/rsvp/Confirmation.tsx           — Server-rendered, fed by getConfirmationData.
app/rsvp/steps/
  StepNameEntry.tsx
  StepAttendance.tsx
  StepMondayMeetup.tsx
  StepTransportation.tsx
  StepBeverage.tsx                  — Repeats per attending guest.
  StepAccommodations.tsx
  StepReview.tsx
app/rsvp/components/
  StepIndicator.tsx                 — Dot progress, collapses on skip path.
  GuestCard.tsx
  WipeWarningBanner.tsx

=== PAGE BACKDROP ===
Wrap so PageBackdrop renders with data-mode="interior" (matches Q&A,
Venue, Registry — hides palm/courthouse/coastal on mobile per the
live CSS).

=== PAGE HEADER ===
Visible on all wizard steps. NOT visible on Confirmation when
?confirmation= is set.

H1 (font-serif weight 600, --text-3xl desktop / --text-2xl mobile,
    color --color-palm-leaf, line-height 1.15 / 1.2, text-align center):
  "Levi & Meghan's Wedding RSVP"

Subline directly below H1 — three segments separated by hairline gold
pillars (clone .InfoItem_pillar pattern):

  IX.XXIX.MMXXVI · {countdown} · Santa Barbara

  - Roman numeral block: font-sans weight 400, --text-xs,
    letter-spacing 0.04em, color --color-terracotta. Same as
    .InfoItem_label__AbQsV.
  - Countdown computed server-side. The H1 component receives the
    count as a prop.
    Date: new Date('2026-09-29T00:00:00-07:00')
    Today: new Date()
    Days = Math.ceil((wedding - today) / 86400000)
    Format:
      days < 0   → suppress this segment (header has 2 segments only)
      days === 0 → "Wedding day!"
      days === 1 → "1 day left"
      days > 1   → `${days} days left`
  - "Santa Barbara": same style as Roman block.
  - Pillars: width var(--border-hairline) (1px), height = type cap
    height + var(--space-1), color --color-gold at 50% opacity,
    margin-inline var(--space-3).
  - Mobile (<768px): if line wraps, drop "Santa Barbara"; keep
    Roman + countdown.

=== STEP INDICATOR ===
Renders horizontally, gap var(--space-2), centered. Below the page
header, above the step card. Hidden on Confirmation.

CRITICAL: dot count is dynamic, not always 7.

  Compute dot count on every state change:
    - If at least one guest is attending: 7 dots (steps 1-7)
    - If all guests are declining: 4 dots (steps 1, 2, 6, 7 displayed
      as 1, 2, 3, 4 visually — Steps 3/4/5 are skipped and DO NOT
      show as dots at all)

  Dot diameter: var(--space-2) (16px)
  Active: --color-palm-leaf solid fill
  Complete: --color-palm-leaf solid + small white check glyph centered
  Upcoming: transparent fill + var(--border-hairline) solid --color-gold border

  Reduced motion: dots are static.
  Default: completed dots scale 0.9 → 1.0 spring on transition,
  duration var(--motion-fast), ease var(--ease-out-soft).

=== STEP CARD CONTAINER ===
Single column max-width var(--content-max-width), centered.
Padding: var(--space-6) desktop / var(--space-4) mobile.
Padding-block: var(--space-8) desktop / var(--space-6) mobile.

NO box-shadow. NO outer border. Sits on the --color-bg page background.
Subsection breaks within the card use var(--border-hairline) solid
--color-gold, padding var(--space-3) above and below.

Step transitions: AnimatePresence using --ease-out-soft, duration
var(--motion-std) (800ms).
  Enter: x: 24 → 0, opacity 0 → 1
  Exit: x: -24, opacity 1 → 0

@media (prefers-reduced-motion: reduce):
  Instant cut. No slide. No fade.

Back link: above the card. Font-sans weight 500, --text-base,
color --color-teal, hairline underline on hover with --color-gold
underline color. Hidden on Step 1 and Confirmation.

=== STEP 1 — NAME ENTRY ===

Heading: "Find your invitation."
Body: "Enter your first or last name to get started. We'll find your
       group and pull up everything for you."

Input wrapper: margin-block-start var(--space-6).

Label: "GUEST NAME" (eyebrow style — font-sans weight 600,
       --text-xs, letter-spacing 0.12em, uppercase,
       color --color-coral-rose, display block,
       margin-block-end var(--space-1))

Input: font-sans weight 400, --text-lg, color --color-brown,
       padding-block var(--space-2), padding-inline var(--space-3),
       border var(--border-hairline) solid --color-gold,
       background transparent, border-radius 0,
       width 100%, min-height var(--height-tap)

  States:
    :focus-visible → outline var(--border-focus) solid --color-gold,
                     outline-offset var(--border-focus),
                     border-radius var(--radius-sm)
    on error → border-color --color-coral-rose

  Placeholder: "Your first or last name"

Behavior:
  - On blur (300ms debounce after blur), call lookupParty(value).
  - Skip if value is empty or whitespace-only.
  - Loading indicator: 1px --color-teal underline at input bottom,
    opacity oscillates 0.3 → 1.0 over 800ms.
    Reduced-motion: solid 0.5 opacity, no oscillation.
  - On 'no_match':
      Inline message below input, margin-block-start var(--space-2),
      font-sans --text-base, color --color-coral-rose:
      "We couldn't find that name. Try your full name, a different
       spelling, or your partner's name. Still stuck? Reach out to
       Levi or Meghan directly."
  - On 'ambiguous':
      Inline message: "We found more than one match. Please enter
       your full name (e.g. 'Sarah Kim')."
  - On 'server_error':
      "Something went wrong — please try again."
  - On success: transition to Step 2.

No submit button. No Enter-submits.

=== STEP 2 — ATTENDANCE ===

Heading: "Who's joining us?"
Body: "Make a selection for each person in your group. Anyone who's
       already responded can still be updated here."

For each guest in the party, render a GuestCard, vertically stacked
with gap var(--space-3).

GuestCard structure:
  - Container: padding var(--space-4),
    border-block-end var(--border-hairline) solid --color-gold
    (last child no border).
  - Title row:
      Title (font-serif weight 600, --text-xl, line-height 1.2,
             color --color-teal):
        - No existing RSVP: guest.full_name
        - Existing RSVP: "Update " + guest.first_name + "'s RSVP"
      "Already responded" pill (only if existing RSVP):
        font-sans weight 600, --text-xs, letter-spacing 0.04em,
        uppercase, color --color-bg, background --color-palm-leaf,
        padding-block var(--space-half), padding-inline var(--space-2),
        margin-inline-start var(--space-2),
        border-radius var(--radius-full)
  - Two option buttons side-by-side at >= 480px, stacked smaller:
      "Attending" / "Not Attending"
      
      Inherit RSVPButton state model:
        Default (unselected): bg transparent, color --color-brown,
          border var(--border-hairline) solid --color-gold,
          padding-block var(--space-2), padding-inline var(--space-3),
          font-sans weight 500, --text-base, line-height 1,
          border-radius 0, min-height var(--height-tap)
        Hover (hover:hover && pointer:fine):
          bg color-mix(in oklch, var(--color-palm-leaf) 6%, transparent),
          transform scale(1.02)
          [no transform under reduced-motion]
        Active: transform scale(0.97)
        Focus-visible: outline var(--border-focus) solid --color-gold,
          outline-offset var(--border-focus)
        Selected: bg --color-palm-leaf, color --color-bg,
          border-color --color-palm-leaf
        Selected + Hover: bg --color-palm-leaf-deep, transform scale(1.02)
        Disabled: opacity 0.4, cursor not-allowed,
          pointer-events none, transform none

  - WipeWarningBanner inside the GuestCard, below the buttons,
    only when:
      this guest had at least one non-null downstream answer
      (existing_rsvp.monday_meetup, needs_transport, or beverage_category)
      AND user just toggled them from Attending to Not Attending in
      this session.

    Background --color-sand-linen
    Padding var(--space-3)
    Margin-block-start var(--space-3)
    Font-sans --text-base, color --color-brown

    Text: "Heads up — when you submit, [first_name]'s drink and event
           preferences will be cleared. Toggle back to Attending to keep them."

    Inline "Undo" button (text link style — font-sans weight 500,
    --text-base, color --color-teal, hairline gold underline on hover):
      On click → set attendance back to true, hide the banner.

    Reduced-motion: no entrance animation (banner appears instantly).
    Default: opacity 0 → 1, max-height 0 → auto over var(--motion-fast).

Continue button (RSVPButton style, full width on mobile,
max-width 480px on desktop, centered, margin-block-start var(--space-6)):
  "Continue"
  Disabled until every guest has a selection.

=== STEP 3 — MONDAY MEETUP ===

Skip if zero guests attending (the wizard goes 2 → 6 directly).

Heading: "Monday Evening Meetup"
Body: "We're hosting a casual get-together the evening before the
       wedding — Monday, September 28th. Nothing fancy, no dress code.
       Who can join?"

For each ATTENDING guest, render a checkbox row:
  - Wrapping <label>, display flex, gap var(--space-2),
    padding-block var(--space-2), border-block-end var(--border-hairline)
    solid --color-gold (last no border), cursor pointer,
    min-height var(--height-tap).
  - Native <input type="checkbox"> visually styled (not replaced by div):
    box var(--space-2) (16px) square, border var(--border-hairline)
    solid --color-gold, border-radius var(--radius-sm), bg transparent.
    :checked → bg --color-palm-leaf, white check glyph centered.
    :focus-visible → outline var(--border-focus) solid --color-gold,
                     outline-offset var(--border-focus).
  - Guest name: font-serif weight 500, --text-lg, color --color-brown.

  Pre-fill from existing_rsvp.monday_meetup if not null,
  else unchecked.

Continue button: "Continue". Always enabled.

=== STEP 4 — TRANSPORTATION ===

Skip if zero guests attending.

Heading: "Getting to the Reception"
Body: "After the ceremony at Sunken Garden, we're arranging rides to
       Cabrillo Pavilion. Who would like a spot?"

Same checkbox pattern as Step 3, pre-filled from existing_rsvp.needs_transport.

Continue: "Continue". Always enabled.

=== STEP 5 — BEVERAGE (REPEATING) ===

Skip if zero guests attending.

State holds beverageGuestIndex (0-based). After last attending guest's
beverage page, advance to Step 6 — UNLESS returnToReview flag is set
(from a Review screen edit), in which case jump back to Step 7.

Sub-indicator at top of card (eyebrow style):
  "[FIRST_NAME]'S DRINK · [N] OF [TOTAL]"

Heading (page-heading style): "[first_name]'s Drink of Choice"
Body: "We want to make sure your glass is never empty."

CATEGORY GRID:
  2 cols at <768px, 3 cols at 768-1023, 5 cols at >=1024.
  Gap var(--space-3).

Each category card:
  Container: padding var(--space-3), background --color-sand-linen,
             border-radius var(--radius-md), cursor pointer,
             transition: background var(--motion-fast) var(--ease-out-soft),
                         transform 160ms ease-out

  Category name: font-serif weight 600, --text-xl, line-height 1.1,
                 color --color-teal
  Drink list: margin-block-start var(--space-1),
              font-sans weight 400, --text-sm, line-height 1.4,
              color --color-gold-dark.
              Each drink on its own line, en-dash separator for ingredients.

  States (mirror RSVPButton):
    Hover (hover:hover && pointer:fine):
      transform scale(1.02), bg lightened 4% via color-mix
    Active: transform scale(0.97)
    Focus-visible: outline var(--border-focus) solid --color-gold,
                   outline-offset var(--border-focus)
    Selected: bg --color-palm-leaf, category color --color-bg,
              drink list color rgba(--color-bg @ 70%) [use color-mix]
    Disabled: opacity 0.4, pointer-events none

CATEGORIES (drinks ship verbatim — user will adjust before running):

  COCKTAILS
    Mojito — rum, mint, lime, soda water
    Old Fashioned — bourbon, bitters, orange peel
    Paloma — tequila, grapefruit, lime, salt
    Aperol Spritz — Aperol, prosecco, soda water

  MOCKTAILS
    Garden Spritz — cucumber, elderflower, soda water
    Virgin Paloma — grapefruit, lime, honey, soda water
    Hibiscus Lemonade — hibiscus tea, lemon, honey

  WINE
    Red · White · Rosé · Sparkling

  BEER
    Lager · IPA · Wheat Beer

  NON-ALCOHOLIC
    Sparkling water · Still water · Sodas & juices

DRINK PILL ROW (revealed below grid when a category is selected,
EXCEPT Non-Alcoholic which has no sub-selection):

  Container: margin-block-start var(--space-4)
  Reveal: grid-template-rows 0fr → 1fr (FAQRow_answerWrap pattern)
          transition var(--motion-fast) var(--ease-out-soft)
          Reduced-motion: instant.

  Each pill:
    display inline-flex, align-items center, gap var(--space-1),
    padding-block var(--space-1), padding-inline var(--space-3),
    min-height var(--height-tap), border-radius var(--radius-full),
    border var(--border-hairline) solid --color-gold,
    bg transparent, font-sans weight 500, --text-base,
    color --color-brown, cursor pointer.

    Same five interaction states as category cards (selected fills
    palm-leaf).

  Changing category clears the previously selected pill.

Pre-fill: if existing_rsvp.beverage_category is set, pre-select that
category. If existing_rsvp.beverage_selection set, pre-select that pill.

Continue button:
  Disabled until category selected.
  Non-Alcoholic: enabled with category alone.
  Others: enabled when category + pill both selected.

=== STEP 6 — ACCOMMODATIONS ===

Always shown — even if every guest declined.

Heading: "Anything we should know?"
Body: "Dietary restrictions, accessibility needs, or anything else
       that would help us take care of you. This is a single note for
       your whole group — leave one note and we'll make sure everyone
       is covered."

EXISTING NOTE BOX (renders ONLY when existing_accommodations is present,
above the textarea):

  Container: bg --color-sand-linen, padding var(--space-4),
             border-radius var(--radius-md),
             margin-block-end var(--space-3)

  Eyebrow: "EXISTING NOTE FROM YOUR PARTY"
  Meta line (font-sans weight 400, --text-sm, color --color-gold-dark,
             margin-block-start var(--space-half)):
    "Last edited by [first_name] on [Month D, YYYY]"
    (If last_edited_by_first_name is null, show only the date.)
  Hint (font-sans --text-base, color --color-brown,
        margin-block-start var(--space-2)):
    "Edit below to update, or leave it as-is to keep it."

Textarea:
  Label: "NOTES FOR THE COUPLE" (eyebrow style)
  Field: font-sans weight 400, --text-base, line-height 1.5,
         color --color-brown, bg transparent,
         padding var(--space-3),
         border var(--border-hairline) solid --color-gold,
         border-radius var(--radius-sm),
         min-height calc(var(--space-12) + var(--space-3)) (120px),
         width 100%, resize vertical.

         Pre-fill with existing_accommodations.notes if present.

         Placeholder (when empty): "Optional — allergies, mobility
                                     needs, dietary restrictions, etc."

         Same focus-visible / disabled patterns as Step 1 input.

Continue button: "Review RSVP". Always enabled.

=== STEP 7 — REVIEW ===

Heading: "Review your RSVP."
Body: "Everything look right? You can edit booleans inline, or jump
       back to specific steps for the rest."

For each guest, render a summary block:
  Container: padding-block var(--space-3), border-block-end
             var(--border-hairline) --color-gold (last no border).

  Top row: flex space-between, align-items center, gap var(--space-2)
    Guest name: font-serif weight 600, --text-xl, --color-teal
    Status pill (eyebrow + colored dot):
      "ATTENDING"     → dot --color-palm-leaf
      "NOT ATTENDING" → dot --color-coral-rose
      8px circle, gap var(--space-1), label same eyebrow style.

  Detail rows (only for attending guests):
    --- INLINE EDITS (booleans):
    Monday and Transport rendered as toggle pills (not text).
    Each row:
      display flex, gap var(--space-3), padding-block var(--space-1),
      align-items center.
      Label (eyebrow style, min-width 96px):
        "MONDAY"  /  "TRANSPORT"
      Toggle pill (renders Yes / No state, click to flip):
        font-sans weight 500, --text-base,
        padding-block var(--space-half), padding-inline var(--space-2),
        border-radius var(--radius-full),
        border var(--border-hairline) solid --color-gold.
        Yes state: bg --color-palm-leaf at 18%, color --color-palm-leaf-deep.
        No state: bg --color-coral-rose at 12%, color --color-coral-rose.
        Hover: scale(1.02). Active: scale(0.97).
        Focus-visible: outline gold.
        On click: flip the in-state value. No DB write — change
        commits when user clicks Submit.

    --- STEP-JUMP (beverage):
    Drink row:
      Label: "DRINK"
      Value (font-sans --text-base --color-brown):
        beverage_selection || beverage_category
      Inline "Edit drink" link to the right (text link, --color-teal,
      hairline gold underline on hover):
        On click → set beverageGuestIndex to this guest's
        attending-index, set returnToReview = true, jump to Step 5.

  Single "Edit attendance" link below all guest summaries
  (--color-teal, eyebrow row right-aligned):
    On click → jump to Step 2. NO returnToReview flag — the wizard
    re-flows naturally and lands back on Review when done.

GROUP NOTE block:
  Padding-block var(--space-3)
  Eyebrow: "ACCOMMODATION NOTE"
  --- INLINE EDIT (textarea):
    Render the same textarea as Step 6, pre-filled with current
    accommodations value. On change → update in-state value. No DB
    write until Submit.

Submit button (RSVPButton style, full width mobile,
max-width 480px desktop, centered, margin-block-start var(--space-6)):
  "Submit RSVP"

  Loading: pulsing fill animation, opacity 0.85 → 1 over 800ms.
           Reduced-motion: solid disabled state, no pulse.

  Error: inline below button, font-sans --text-base, --color-coral-rose:
    "Something went wrong — please try again. If this keeps happening,
     reach out to Levi or Meghan directly."

  Success: router.push(`/rsvp?confirmation=${result.partyId}`)

=== CONFIRMATION (server-rendered when ?confirmation= in URL) ===

In app/rsvp/page.tsx (Server Component):
  export const dynamic = 'force-dynamic'    // CRITICAL — no caching

  - Read searchParams.confirmation.
  - If present: const data = await getConfirmationData(...)
      If error: silently render the wizard (treat as no confirmation).
      If success: render <Confirmation data={data} />
  - If not present: render <RsvpClient />

Confirmation.tsx structure:
  Container: max-width var(--content-max-width), centered,
             padding-block var(--space-12) desktop / var(--space-8) mobile,
             padding-inline var(--space-4), text-align center.

  Top ornament: <img src="/images/svg/palm-break.svg" alt="" />
                Width 240px desktop / 180px mobile, height auto,
                margin-block-end var(--space-6).

  Heading (font-serif weight 600, --text-4xl desktop / --text-3xl
           mobile, line-height 1.1, color --color-palm-leaf):

    Variant 'attending':  "Woohoo!!!"
    Variant 'declining':  "No worries, honestly!"

  Body (font-sans weight 400, --text-lg, line-height 1.5,
        color --color-brown, max-width 540px, centered,
        margin-block-start var(--space-4)):

    Variant 'attending' — first-name list formatter:
      Use Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
      if available, else this fallback:
        1 → names[0]
        2 → `${names[0]} and ${names[1]}`
        3+ → `${names.slice(0,-1).join(', ')}, and ${names[names.length-1]}`

      Body string:
        "{names}, we're looking forward to celebrating our special
         day with you. Safe travels and start the countdown!"

    Variant 'declining':
        "We understand this is a cross country trip on short notice
         for most people. We appreciate the consideration and want
         you to know you've had a profound impact on our lives."

  Date pillars (margin-block-start var(--space-8)): mirror the page
  header subline (Roman / countdown / Santa Barbara with gold pillars).

  Bottom ornament: another palm-break.svg, margin-block-start
  var(--space-8), margin-block-end var(--space-4).

  Footer line (font-sans italic, --text-base, --color-gold-dark):
    "Take a look at the [Venue](/venue) and [Travel](/travel) pages
     while you're here."

  Reduced-motion: instant render, no fade.
  Default: heading fade+rise (opacity 0→1, translateY 12px → 0)
           over var(--motion-std) with --ease-out-soft.
           Body lags 200ms. Bottom ornament lags 400ms.

=== STATE MANAGEMENT ===

In RsvpClient.tsx:

type WizardState = {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7
  party: PartyResult | null
  attendance: Record<string, boolean | undefined>
  mondayMeetup: Record<string, boolean>
  transport: Record<string, boolean>
  beverage: Record<string, { category: string; selection: string | null }>
  beverageGuestIndex: number
  accommodations: string
  returnToReview: boolean              // set true when entering Step 5 from Review
  wipeWarnings: Record<string, true>
  submitting: boolean
  submitError: string | null
}

Initialization on Step 1 success:
  Seed attendance / mondayMeetup / transport / beverage / accommodations
  from existing_rsvp + existing_accommodations on each guest.

Wipe warning logic:
  When attendance toggled true → false AND that guest had ANY non-null
  existing_rsvp downstream answer, set wipeWarnings[guestId] = true.
  Toggling back to true clears the flag.

Skip logic between steps (computed live):
  Step 2 → Step 3 if attendingGuests.length > 0, else Step 6
  Step 3 → Step 4
  Step 4 → Step 5 (beverageGuestIndex = 0)
  Step 5 → Step 5 (next guest) if beverageGuestIndex + 1 <
                                  attendingGuests.length
                  else Step 6 — UNLESS returnToReview, in which case
                  Step 7 and clear the flag
  Step 6 → Step 7
  Step 7 → submitRsvp → router.push('/rsvp?confirmation=...')

Edit-from-Review entry points:
  "Edit attendance" → jump to Step 2. No returnToReview flag.
  "Edit drink" on guest X → set beverageGuestIndex to X's attending-index,
                            set returnToReview = true, jump to Step 5.
  Inline boolean toggles → no step jump.
  Inline accommodations textarea → no step jump.

=== ACCESSIBILITY ===
  - Every input has explicit <label> bound by htmlFor/id.
  - Step 2 attendance buttons: role="radiogroup" wrapping
    role="radio" + aria-checked. Arrow keys navigate.
  - Step 3/4 checkboxes: native <input type="checkbox">.
  - Step transitions: aria-live="polite" status region announcing
    "Step X of Y: [step heading]" on change. Y is the dynamic dot
    count from StepIndicator.
  - On step transition, focus moves to the new step's <h1>
    (tabindex="-1" so it can receive focus programmatically).
  - Every interactive element has a focus-visible outline:
    var(--border-focus) solid --color-gold,
    var(--border-focus) offset.

=== IMPORTS ===
  import { lookupParty }        from '@/app/actions/lookupParty'
  import { submitRsvp }         from '@/app/actions/submitRsvp'
  import { getConfirmationData } from '@/app/actions/getConfirmationData'
  import { useRouter, useSearchParams } from 'next/navigation'
  import { motion, AnimatePresence } from 'framer-motion'

Build all files. No placeholder copy. No lorem.
Every visual property is a token reference.
```

---

## PHASE 5 — Admin Extension

### 5.1 💻 CLAUDE CODE — Add to existing /admin

```
Extend the existing /admin dashboard page with RSVP visibility.

Find the admin page first (app/admin/page.tsx or similar). Read it
carefully. Match its visual conventions. Do NOT break existing
functionality.

DATA FETCH (Server Component):
  Call getAdminRsvpSummary() — already created in Phase 3.
  Pass results to a Client Component for the CSV export click handler.

=== ADD ONE CARD TO THE EXISTING CONTRIBUTIONS ROW ===

The existing /admin already has a row of three contribution cards
(Honeymoon, Kiva, HDMG). Add a fourth card to the right of those,
matching the existing layout, padding, typography, and color treatment
EXACTLY. Do not introduce a new card style.

Card content:
  Eyebrow (matches the contribution cards' eyebrow exactly):
    "RSVPS"
  Value (matches the contribution cards' value treatment exactly):
    "{attending_count} / {total_invited} attending"
    Examples:
      Mid-window: "47 / 72 attending"
      Final state: "60 / 72 attending"

If the contributions row uses a flex/grid layout that doesn't extend
gracefully to four cards: change the row to support four cards
without breaking the three-card layout's visual proportions. Match
spacing tokens, never introduce arbitrary px.

=== DECLINED GUESTS TABLE ===

Below the cards row, add a new section:

  Section heading (font-serif weight 600, --text-2xl, color
                   --color-palm-leaf, margin-block-start var(--space-8),
                   margin-block-end var(--space-4)):
    "Not Attending"

  Section eyebrow above heading (font-sans weight 600, --text-xs,
                                  letter-spacing 0.12em, uppercase,
                                  color --color-coral-rose,
                                  margin-block-end var(--space-1)):
    "FOLLOW-UPS"

  If declining_guests.length === 0:
    Render a single muted line (font-sans italic, --text-base,
    color --color-gold-dark):
    "No one has declined yet."

  Otherwise, render the table:

    Columns: Name | Note Left

    Header row: font-sans weight 600, --text-xs, letter-spacing 0.12em,
                uppercase, color --color-coral-rose,
                padding-block var(--space-2),
                border-block-end var(--border-hairline) --color-gold.

    Data rows: padding-block var(--space-3),
               border-block-end var(--border-hairline) solid
               color-mix(in oklch, var(--color-gold-dark) 30%, transparent).

    Name column (40% width on desktop, 50% mobile):
      font-serif weight 500, --text-lg, color --color-teal.
      Below the name (margin-block-start var(--space-half)):
        Party (font-sans weight 400, --text-sm, color --color-gold-dark):
          "[party_name]"

    Note Left column (60% width desktop, 50% mobile):
      If accommodation_notes is present:
        font-sans weight 400, --text-base, color --color-brown,
        line-height 1.5.
      Otherwise:
        "—" in --color-gold-dark, italic.

=== CSV EXPORT BUTTON ===

Place at the top right of the "Not Attending" section heading row
(or directly above the table if the heading row layout doesn't permit).

Button style: match the existing RegistryButton or admin's existing
button style (palm-leaf bg, no radius, font-sans 500, --text-base,
color --color-bg, padding-block var(--space-1) + var(--space-half),
padding-inline var(--space-3), min-height var(--height-tap)).

Label: "Export Full RSVP CSV"

On click:
  const result = await exportRsvpCSV()
  if ('error' in result) → show inline toast/alert with the error.
  else:
    Create Blob from result.csv, type 'text/csv'.
    Trigger download with filename:
      'rsvp-responses-' + new Date().toISOString().slice(0, 10) + '.csv'

This export contains the FULL data set (all guests, all answers,
all parties), not just declines. The on-screen table is just for
follow-up management.
```

---

## PHASE 6 — Daily Digest Email

### 6.1 🧑 YOU — Verify Resend account

Sign in to [resend.com](https://resend.com). If you don't have an account, create one (free tier — 3,000 emails/month).

### 6.2 🧑 YOU — Verify the sending domain

In Resend → **Domains → Add Domain** → enter `levibahn.com`.

Resend gives you 4 DNS records to add to your domain registrar (likely Namecheap, GoDaddy, Cloudflare, or wherever `levibahn.com` is registered):

| Record Type | Purpose |
|---|---|
| MX | Return-path |
| TXT (SPF) | SPF record |
| TXT (DKIM) | DKIM record |
| TXT (DMARC) | Optional but recommended |

Add all four records exactly as Resend specifies. Verification can take 5–60 minutes — Resend will show a green "Verified" status when ready.

**Yahoo deliverability note:** `meghancave@yahoo.com` is on Yahoo, which is aggressive about spam-filtering email from new sending domains. After the first digest test send, Meghan should:
1. Check her Spam folder for the test email.
2. If found, click "Not Spam" / move to Inbox.
3. Add `rsvp@levibahn.com` to her Contacts.

After 5–10 such trainings, deliverability stabilizes.

### 6.3 🧑 YOU — Generate Resend API key

In Resend → **API Keys → Create API Key** → name it `bahn-cave-digest`, scope to `Sending access`. Copy the key (starts with `re_...`).

Add to **Vercel Project Settings → Environment Variables** for both Production AND Preview:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | `re_...` |
| `CRON_SECRET` | A random 32-character string (generate with `openssl rand -hex 16`) — used to authorize Cron requests |

Save. Vercel will redeploy automatically.

### 6.4 💻 CLAUDE CODE — Build the digest pipeline

```
Create the daily RSVP digest email pipeline.

=== FILE 1: app/api/cron/rsvp-digest/route.ts ===

Vercel Cron-triggered route handler.

Behavior:
  - Method: GET (Vercel Cron sends GET)
  - Authorization: check the Authorization header against
    `Bearer ${process.env.CRON_SECRET}`. Reject with 401 if mismatched.
    Vercel Cron automatically sends this header when configured.
  - Call sendRsvpDigest() from app/actions/sendRsvpDigest.ts.
  - Return JSON response:
      { sent: result.sent, reason: result.reason }
      Status 200 on success or skipped, 500 on error.

=== FILE 2: vercel.json ===

Add a crons section (or update if file already exists):

  {
    "crons": [
      {
        "path": "/api/cron/rsvp-digest",
        "schedule": "0 13 * * *"
      }
    ]
  }

  This runs at 13:00 UTC daily = 7:00 AM Mountain Daylight Time
  (which covers the entire active RSVP window May–Aug 2026).

=== FILE 3: emails/RsvpDigest.tsx ===

React Email template (npm install @react-email/components @react-email/render
if not present).

Brand alignment: Copper & Quartz design language. Inline CSS only — no
external stylesheets in HTML email. Use brand color hex values
explicitly (custom properties don't work in email clients).

Structure:
  - Background #FBF3E9 (page bg).
  - Centered container, max-width 600px, padding 32px.
  - Header:
      Eyebrow (font-family Helvetica/Arial/sans-serif, weight 600,
      letter-spacing 0.12em, uppercase, font-size 12px, color #C86A4A,
      margin-bottom 8px):
        "RSVP DIGEST"
      Title (font-family Georgia/'Cormorant Garamond' fallback, weight 600,
      font-size 32px, color #4F7A4A, margin-bottom 4px):
        "{N} new responses"
      Date subtitle (font-family Helvetica fallback, weight 400,
      font-size 14px, color #877660):
        "{Day, Month D, YYYY}"
  - Hairline divider (1px solid #C2A98B at 50% opacity, margin 24px 0).
  - For each new RSVP response:
      Guest name + party in serif (Georgia, weight 600, 18px, #2F7F7B)
      Status badge (small caps, 12px, color depends on attending):
        Attending → background rgba(79,122,74,0.18), color #468C3E
        Not Attending → background rgba(181,67,47,0.12), color #B5432F
      If attending: 3 detail rows (Monday / Transport / Drink) as
        label (12px caps coral-rose) + value (16px brown).
      If updated (submitted_at !== updated_at): small "(Updated)" tag
        next to the status badge in #877660 italic.
      Vertical spacing 16px between guests, hairline divider between parties.
  - For each accommodation note that appeared in the digest window:
      Section heading (small caps coral-rose 12px): "PARTY NOTE"
      Party name in 14px brown.
      Note text in 16px brown, line-height 1.5, italic.
      "Last edited by [first_name]" in 14px gold-dark.
  - Footer: small text, "Sent automatically from rsvp@levibahn.com.
    To stop these emails, reply to Levi."

Export as default component RsvpDigest({ responses, accommodations, total }).

=== FILE 4: Update app/actions/sendRsvpDigest.ts ===

(Already specified in Phase 3 prompt. Confirm:)
  - Uses render() from @react-email/render to convert RsvpDigest
    component to HTML string.
  - Sends via Resend SDK:
      to: ['levi@levibahn.com', 'meghancave@yahoo.com']
      from: 'rsvp@levibahn.com'
      replyTo: 'levi@levibahn.com'
      subject: `RSVP digest — ${total} new responses · ${formattedDate}`
      html: <rendered RsvpDigest>
  - Inserts digest_runs row only on Resend success.

=== FILE 5: scripts/test-digest.ts ===

A local test script:
  Calls sendRsvpDigest() directly.
  Logs the result.
  Used to manually trigger a test send before relying on Cron.

Add npm script: "test:digest": "npx ts-node scripts/test-digest.ts"
```

### 6.5 🧑 YOU — Trigger a test digest

Once the build is deployed and the Resend domain is verified:

```bash
npm run test:digest
```

Expected outcomes:

| Scenario | Expected |
|---|---|
| No test RSVPs in the DB | `{ sent: false, reason: 'no_new_rsvps' }` — no email |
| At least one new RSVP since the last digest_runs row | Email arrives at both addresses; new digest_runs row inserted |

Check both inboxes. Check Meghan's Yahoo Spam folder if not in Inbox. Train Yahoo by clicking "Not Spam" if needed.

---

## PHASE 7 — QA

### 7.1 🧑 YOU — Local QA on the wizard

`npm run dev` → `http://localhost:3000/rsvp`.

**Step 1 — Name Entry**
- [ ] Valid first name → blur → loading → party loads
- [ ] Valid last name → party loads
- [ ] Valid alias (lowercase or any case) → party loads
- [ ] Unknown name → 'no_match' error inline
- [ ] Ambiguous name (two parties have a "Sarah") → 'ambiguous' error prompts for full name
- [ ] Empty/whitespace blur → no error fires
- [ ] Retype after error → error clears on next blur

**Step 2 — Attendance**
- [ ] All party members shown
- [ ] Existing RSVPs show "Already responded" pill + pre-selected
- [ ] Unresponded guests have no default selection
- [ ] Continue disabled until every guest has a selection
- [ ] Toggling a guest with prior answers from Yes→No shows wipe banner under their card
- [ ] Banner "Undo" reverts the toggle
- [ ] All-decline path: wizard skips Step 3, 4, 5; advances directly to Step 6
- [ ] Step indicator shows 4 dots on all-decline path, 7 on attending path

**Steps 3–4 — Monday / Transport**
- [ ] Skipped if all decline
- [ ] Only attending guests shown
- [ ] Existing values pre-filled
- [ ] Continue always enabled

**Step 5 — Beverage**
- [ ] Sub-indicator: "[NAME]'S DRINK · N OF TOTAL"
- [ ] Cocktails reveals Mojito/Old Fashioned/etc. pills
- [ ] Changing category clears prior pill
- [ ] Non-Alcoholic shows no pills, Continue enabled with category alone
- [ ] Existing values pre-filled on update
- [ ] After last attending guest, advances to Step 6

**Step 6 — Accommodations**
- [ ] Always shown
- [ ] If existing note: "EXISTING NOTE FROM YOUR PARTY" box renders with editor name + date
- [ ] Textarea pre-fills with existing
- [ ] Continue always enabled

**Step 7 — Review (edit-from-review behavior)**
- [ ] Each attending guest shows correct answers
- [ ] Declining guests show only "Not Attending"
- [ ] Monday and Transport are inline TOGGLE PILLS (not text), click to flip
- [ ] Drink shows value + "Edit drink" link → jumps to that guest's Step 5
- [ ] After editing drink and hitting Continue → returns to Step 7 (returnToReview flag)
- [ ] Accommodations textarea is editable inline, no step jump
- [ ] "Edit attendance" link → Step 2; re-flow lands back on Step 7 naturally
- [ ] Submit shows pulsing fill, then routes to /rsvp?confirmation=<id>

**Confirmation**
- [ ] Variant attending: "Woohoo!!!" + first names list (1, 2, 3+)
- [ ] Variant declining: "No worries, honestly!"
- [ ] palm-break.svg renders top + bottom
- [ ] Hard refresh on `?confirmation=<id>` re-renders correct variant
- [ ] Date pillar line renders correctly on mobile

**Cross-cutting**
- [ ] PageBackdrop renders on desktop, hides on mobile (interior mode)
- [ ] H1 reads "Levi & Meghan's Wedding RSVP"
- [ ] Subline reads "IX.XXIX.MMXXVI · {N} days left · Santa Barbara"
- [ ] Pluralization: 1 day not "1 days"
- [ ] Body color is --color-brown
- [ ] Errors use --color-coral-rose
- [ ] Focus-visible gold outline on all interactive elements
- [ ] Tab through whole wizard with no mouse — every step reachable
- [ ] Reduced-motion: step transitions instant, no slide-fade

### 7.2 🧑 YOU — DB verification

Submit a test RSVP for a multi-guest party with mixed outcomes, then:

```sql
select
  g.full_name, gp.party_name,
  r.attending, r.monday_meetup, r.needs_transport,
  r.beverage_category, r.beverage_selection,
  a.notes               as accommodation_notes,
  edited_by.first_name  as note_last_edited_by,
  r.updated_at
from guests g
join guest_parties gp        on gp.id = g.party_id
left join rsvp_responses r   on r.guest_id = g.id
left join rsvp_accommodations a on a.party_id = gp.id
left join guests edited_by   on edited_by.id = a.last_edited_by_guest_id
order by gp.party_name, g.full_name;
```

Confirm:
- Declining guests have NULL on monday/transport/beverage_*.
- Attending guests have all answers populated.
- Accommodation note repeats on each row of that party.
- note_last_edited_by has the correct submitter's first name.
- Re-submit updates updated_at, never duplicates.

### 7.3 🧑 YOU — Confirmation refresh check

1. Submit. URL becomes `/rsvp?confirmation=<uuid>`.
2. Hard refresh (Cmd+Shift+R). Confirm same variant + names render.
3. Open URL in a different browser. Same view (acceptable).

### 7.4 🧑 YOU — Admin verification

Go to `/admin`:
- [ ] RSVPs card appears in the contributions row, matching layout
- [ ] Card reads correct counts: `{attending} / {total_invited} attending`
- [ ] "Not Attending" section renders the correct list
- [ ] Each declined row shows guest name, party, and note (or "—")
- [ ] "Export Full RSVP CSV" downloads with all columns

### 7.5 🧑 YOU — Digest test

```bash
npm run test:digest
```

- [ ] If no new RSVPs since last digest_runs: returns no_new_rsvps, no email
- [ ] If new RSVPs: email arrives at both inboxes
- [ ] Email renders correctly (Cormorant heading, brown body, palm-leaf accents)
- [ ] Status badges show correct colors
- [ ] Updated responses show "(Updated)" tag

---

## PHASE 8 — Pre-mail Cleanup

### 8.1 🧑 YOU — Day before Save the Dates ship

Wipe all test RSVP data so guests start with a clean slate.

Supabase SQL Editor:

```sql
truncate rsvp_accommodations, rsvp_responses, digest_runs restart identity;
```

This:
- Wipes all RSVP responses
- Wipes all accommodation notes
- Wipes all digest run history
- **PRESERVES** the seeded guest list and parties

Verify:

```sql
select
  (select count(*) from guests)               as guests_remaining,
  (select count(*) from guest_parties)        as parties_remaining,
  (select count(*) from rsvp_responses)       as responses_remaining,
  (select count(*) from rsvp_accommodations)  as accommodations_remaining,
  (select count(*) from digest_runs)          as digest_runs_remaining;
```

Expected: guests + parties intact; responses, accommodations, digest_runs all 0.

### 8.2 🧑 YOU — Mail the Save the Dates

Real RSVPs incoming.

---

## Done

| Phase | What ships |
|---|---|
| 0 Pre-flight | Verified prerequisites |
| 1 Database | 5 tables + indexes + RLS lockdown |
| 2 Guest data | TS types + Excel + seeded guests |
| 3 Server actions | 6 actions, fully typed, service-role only |
| 4 RSVP page | 7-step wizard + confirmation, refresh-safe |
| 5 Admin | RSVPs card + declined table + CSV export |
| 6 Email digest | Resend + Cron + branded template |
| 7 QA | Wizard + DB + admin + digest verified |
| 8 Pre-mail | Test data wiped, list intact |

All data private. No public RLS. No anon-key writes. Refresh-safe via `?confirmation=`. Daily digest, skip-if-empty, 7am Mountain Time.

---

*Build Plan v4 — incorporates v3 audit fixes, Vercel migration, simplified admin, daily digest, pre-mail cleanup.*

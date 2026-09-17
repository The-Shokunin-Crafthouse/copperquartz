-- 004_party_link_source_addresses.sql
--
-- Rationale: mailing addresses live in a separate table, party_addresses, keyed
-- one-to-one on guest_parties(id) — not as columns on guest_parties itself.
-- guest_parties is read by the public, unauthenticated RSVP lookup path
-- (src/app/actions/lookupParty.ts), which needs only id and party_name; widening
-- that table with a postal address would put personal data one careless
-- `select *` away from a public surface, and a future anon-readable policy on
-- guest_parties would expose every guest's home address. A separate table keeps
-- the address behind its own grant and its own (policy-less) RLS boundary, and
-- the one-row-per-party shape is preserved by making party_id the primary key.
-- The cost is one join in the admin read path, which is paid once per dashboard
-- load. All address fields stay nullable so a party can be created, or an
-- address partially captured, without the table objecting; postal_code is plain
-- text and is deliberately NOT digit-validated (at least one address is
-- Canadian, and country-specific formats are a display concern, not a storage
-- constraint).

-- 1. Link a contribution to a guest party. Nullable: a gift from someone who is
--    not on the guest list stays unlinked. ON DELETE SET NULL so removing a
--    party never destroys the money record.
alter table contributions
  add column if not exists party_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contributions_party_id_fkey'
  ) then
    alter table contributions
      add constraint contributions_party_id_fkey
      foreign key (party_id) references guest_parties (id) on delete set null;
  end if;
end
$$;

create index if not exists contributions_party_id_idx
  on contributions (party_id);

-- 2. How the gift arrived. Existing rows are all Stripe checkouts, so the
--    default backfills them correctly and the column can be NOT NULL from the
--    start.
alter table contributions
  add column if not exists source text not null default 'stripe';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contributions_source_check'
  ) then
    alter table contributions
      add constraint contributions_source_check
      check (source in ('stripe', 'self-reported', 'cash', 'check'));
  end if;
end
$$;

-- Carry the existing self_reported boolean forward into the new vocabulary.
-- coalesce() treats a null self_reported as false. Scoped to rows still sitting
-- at the default so a re-run cannot overwrite a hand-set 'cash' or 'check'.
update contributions
   set source = 'self-reported'
 where coalesce(self_reported, false) is true
   and source = 'stripe';

-- 3. An offline gift (cash, check, or a self-reported Kiva loan) has no email
--    address to record. name stays NOT NULL — every gift has a giver.
alter table contributions
  alter column email drop not null;

-- 4. One mailing address per guest party, for thank-you notes.
create table if not exists party_addresses (
  party_id    uuid primary key references guest_parties (id) on delete cascade,
  street      text,
  apt         text,
  city        text,
  state       text,
  postal_code text,
  country     text,
  created_at  timestamptz default now()
);

-- RLS on with no policies: the service role bypasses RLS, and every read in
-- this app goes through it. anon and authenticated therefore see nothing.
alter table party_addresses enable row level security;

-- Supabase's service_role needs an explicit grant even with RLS disabled.
grant all on table party_addresses to service_role;

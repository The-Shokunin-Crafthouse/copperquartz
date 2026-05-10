/*
 * ============================================================
 * TEMPORARY review-only fixtures for /admin
 * ============================================================
 * These dummy values are wired into page.tsx ONLY when Supabase env
 * vars are missing (preview deploys + local dev). They do not run in
 * production because the production Vercel environment has both
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set.
 *
 * REVERT THIS WHOLE FILE + the page.tsx import + the env-gated branches
 * before merging the PR. A single `git revert` of the dummy-data commit
 * wipes everything cleanly.
 * ============================================================
 */

import type { AdminRsvpSummary } from '@/src/app/actions/getAdminRsvpSummary';
import type { Contribution } from './types';

export const DUMMY_RSVP_SUMMARY: AdminRsvpSummary = {
  total_invited: 49,
  attending_count: 30,
  declining_count: 4,
  awaiting_count: 15,
  monday_count: 26,
  /* 18 individuals across 14 distinct parties — matches Figma's
     "Transportation: 14" card while keeping individual transport_count
     intact for the digest email. */
  transport_count: 18,
  transport_party_count: 14,
  declining_guests: [
    {
      guest_id: 'd1',
      full_name: 'Eleanor Whitaker',
      party_name: 'The Whitaker Family',
      accommodation_notes: null,
      responded_at: '2026-04-22T18:31:00Z',
    },
    {
      guest_id: 'd2',
      full_name: 'Marcus Chen',
      party_name: 'Marcus & Priya',
      accommodation_notes: null,
      responded_at: '2026-04-19T14:02:00Z',
    },
    {
      guest_id: 'd3',
      full_name: 'Priya Iyer',
      party_name: 'Marcus & Priya',
      accommodation_notes: null,
      responded_at: '2026-04-19T14:02:00Z',
    },
    {
      guest_id: 'd4',
      full_name: 'Tomás Reyes',
      party_name: 'Reyes Household',
      accommodation_notes: null,
      responded_at: '2026-04-12T09:47:00Z',
    },
  ],
  /* Drink counts sum to attending_count (30): each guest picks one. */
  beverage_breakdown: [
    { category: 'cocktail', selection: 'Old Fashioned', count: 6 },
    { category: 'cocktail', selection: 'Something Blue', count: 4 },
    { category: 'mocktail', selection: 'Cucumber Spritz', count: 2 },
    { category: 'mocktail', selection: 'Virgin Mojito', count: 2 },
    { category: 'wine', selection: 'Cabernet Sauvignon', count: 5 },
    { category: 'wine', selection: 'Sauvignon Blanc', count: 4 },
    { category: 'beer', selection: 'Local IPA', count: 3 },
    { category: 'beer', selection: 'Pilsner', count: 1 },
    { category: 'non-alcoholic', selection: 'Sparkling Water', count: 2 },
    { category: 'non-alcoholic', selection: 'Iced Hibiscus Tea', count: 1 },
  ],
  special_requests: [
    {
      party_name: 'The Patel Party',
      notes: 'One vegetarian guest and one gluten-free; both prefer to be seated near the bar.',
      last_edited_by_first_name: 'Anika',
      updated_at: '2026-05-02T16:14:00Z',
    },
    {
      party_name: 'Davies Household',
      notes: 'Wheelchair access for Grandma Rose — please reserve an aisle seat at the ceremony and a standard table for reception.',
      last_edited_by_first_name: 'Owen',
      updated_at: '2026-04-28T11:08:00Z',
    },
    {
      party_name: 'The Yamamoto Family',
      notes: 'Severe peanut allergy in our group — please confirm with catering.',
      last_edited_by_first_name: 'Hana',
      updated_at: '2026-04-25T09:30:00Z',
    },
  ],
};

export const DUMMY_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1',
    name: 'The Patel Party',
    email: 'anika@example.com',
    fund: 'honeymoon',
    amount_cents: 50000,
    gift_cents: 50000,
    message: 'Have an unforgettable trip!',
    reference_url: null,
    lenders_choice: false,
    self_reported: false,
    stripe_session_id: 'cs_demo_1',
    created_at: '2026-05-04T10:12:00Z',
  },
  {
    id: 'c2',
    name: 'Davies Household',
    email: 'owen@example.com',
    fund: 'honeymoon',
    amount_cents: 25000,
    gift_cents: 25000,
    message: null,
    reference_url: null,
    lenders_choice: false,
    self_reported: false,
    stripe_session_id: 'cs_demo_2',
    created_at: '2026-05-02T19:45:00Z',
  },
  {
    id: 'c3',
    name: 'Eleanor Whitaker',
    email: 'eleanor@example.com',
    fund: 'kiva',
    amount_cents: 10000,
    gift_cents: 10000,
    message: 'Lender choice — pick someone in agriculture if you can.',
    reference_url: 'https://www.kiva.org/lend/2480192',
    lenders_choice: false,
    self_reported: false,
    stripe_session_id: 'cs_demo_3',
    created_at: '2026-04-29T13:22:00Z',
  },
  {
    id: 'c4',
    name: 'Marcus & Priya',
    email: 'marcus@example.com',
    fund: 'kiva',
    amount_cents: 7500,
    gift_cents: 7500,
    message: null,
    reference_url: null,
    lenders_choice: true,
    self_reported: false,
    stripe_session_id: 'cs_demo_4',
    created_at: '2026-04-26T08:10:00Z',
  },
  {
    id: 'c5',
    name: 'The Yamamoto Family',
    email: 'hana@example.com',
    fund: 'howlin-dog',
    amount_cents: 20000,
    gift_cents: 20000,
    message: 'Donated $200 directly to HDMG. Looking forward to the album!',
    reference_url: null,
    lenders_choice: false,
    self_reported: true,
    stripe_session_id: null,
    created_at: '2026-04-21T15:05:00Z',
  },
  {
    id: 'c6',
    name: 'Reyes Household',
    email: 'tomas@example.com',
    fund: 'howlin-dog',
    amount_cents: 5000,
    gift_cents: 5000,
    message: null,
    reference_url: null,
    lenders_choice: false,
    self_reported: true,
    stripe_session_id: null,
    created_at: '2026-04-15T17:33:00Z',
  },
];

import type { PartyResult } from '@/src/app/actions/lookupParty';

/* Re-export the inline shapes from the real action so wizard components
   can name them. Keeps PartyResult as the single source of truth. */
export type Guest = PartyResult['guests'][number];
export type ExistingAccommodations = NonNullable<
  PartyResult['existing_accommodations']
>;

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WizardState = {
  step: Step;
  party: PartyResult | null;
  submitterGuestId: string | null;
  attendance: Record<string, boolean | undefined>;
  mondayMeetup: Record<string, boolean>;
  transport: Record<string, boolean>;
  beverage: Record<string, { category: string; selection: string | null }>;
  beverageGuestIndex: number;
  accommodations: string;
  returnToReview: boolean;
  wipeWarnings: Record<string, true>;
  submitting: boolean;
  submitError: string | null;
};

export const BEVERAGE_CATEGORIES = [
  'Cocktails',
  'Mocktails',
  'Wine',
  'Beer',
  'Non-Alcoholic',
] as const;

export type BeverageCategory = (typeof BEVERAGE_CATEGORIES)[number];

export const BEVERAGE_SELECTIONS: Record<BeverageCategory, string[]> = {
  Cocktails: ['Mojito', 'Old Fashioned', 'Margarita', 'Aperol Spritz', 'Surprise Me'],
  Mocktails: ['Mojito', 'Shirley Temple', 'Arnold Palmer', 'Surprise Me'],
  Wine: ['Red', 'White', 'Rosé', 'Surprise Me'],
  Beer: ['IPA', 'Lager', 'Wheat', 'Non-Alcoholic Beer', 'Surprise Me'],
  'Non-Alcoholic': [],
};

export function attendingGuestIds(state: WizardState): string[] {
  if (!state.party) return [];
  return state.party.guests
    .filter((g) => state.attendance[g.id] === true)
    .map((g) => g.id);
}

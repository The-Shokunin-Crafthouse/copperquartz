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

/* Wire values match the DB CHECK constraint on
   rsvp_responses.beverage_category. Display labels live in
   BEVERAGE_CATEGORY_LABELS — never invert this. */
export const BEVERAGE_CATEGORIES = [
  'cocktails',
  'mocktails',
  'wine',
  'beer',
  'non-alcoholic',
] as const;

export type BeverageCategory = (typeof BEVERAGE_CATEGORIES)[number];

export const BEVERAGE_CATEGORY_LABELS: Record<BeverageCategory, string> = {
  cocktails: 'Cocktails',
  mocktails: 'Mocktails',
  wine: 'Wine',
  beer: 'Beer',
  'non-alcoholic': 'Non-Alcoholic',
};

export function formatBeverageCategory(category: string | null): string {
  if (!category) return '';
  return (
    BEVERAGE_CATEGORY_LABELS[category as BeverageCategory] ?? category
  );
}

export type BeverageOption = { name: string; ingredients: string };

export type BeverageSelections = {
  cocktails: BeverageOption[];
  mocktails: BeverageOption[];
  wine: string[];
  beer: string[];
  'non-alcoholic': string[];
};

export const BEVERAGE_SELECTIONS: BeverageSelections = {
  cocktails: [
    {
      name: 'Old Fashioned',
      ingredients: 'Bourbon, sweet, citrus, spice',
    },
    {
      name: 'Cabrillo Sunset',
      ingredients: 'Blanco tequila, strawberry, fresh lime, agave',
    },
    {
      name: 'Watermelon Glow',
      ingredients: 'Vodka, watermelon, lemonade, fresh lime',
    },
    {
      name: 'Garden Spritz',
      ingredients: 'Gin, cucumber, lemon, basil, soda',
    },
    {
      name: 'Coastal Smoke',
      ingredients: 'Mezcal, fresh lime, Sprite, light agave',
    },
    {
      name: 'Cinnamon Cloud',
      ingredients: 'Rum, horchata, cinnamon, vanilla',
    },
  ],
  mocktails: [
    {
      name: 'Santa Barbara Spark',
      ingredients: 'Strawberry, lemon, basil, LaCroix Lemon, light agave',
    },
    {
      name: 'Golden Hour Cooler',
      ingredients: 'Watermelon, cucumber, lime, LaCroix Watermelon',
    },
    {
      name: 'Citrus Grove Fizz',
      ingredients: 'Orange, lime, agave, LaCroix Lime, salted rim',
    },
    {
      name: 'Garden Collins',
      ingredients: 'Cucumber, lemon, basil, LaCroix Lemon',
    },
    {
      name: 'Berry Coast Spritz',
      ingredients: 'Strawberry, lime, orange, LaCroix Berry',
    },
    {
      name: 'Cinnamon Tide',
      ingredients: 'Horchata, vanilla, cinnamon, LaCroix Coconut',
    },
  ],
  wine: ['Red', 'White', 'Rosé', 'Surprise Me'],
  beer: ['IPA', 'Lager', 'Wheat', 'Non-Alcoholic Beer', 'Surprise Me'],
  'non-alcoholic': [],
};

export function beverageSelectionCount(category: BeverageCategory): number {
  return BEVERAGE_SELECTIONS[category].length;
}

export function attendingGuestIds(state: WizardState): string[] {
  if (!state.party) return [];
  return state.party.guests
    .filter((g) => state.attendance[g.id] === true)
    .map((g) => g.id);
}

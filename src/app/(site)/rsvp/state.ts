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

export type BeverageOption = { name: string; ingredients: string };

export type BeverageSelections = {
  Cocktails: BeverageOption[];
  Mocktails: BeverageOption[];
  Wine: string[];
  Beer: string[];
  'Non-Alcoholic': string[];
};

export const BEVERAGE_SELECTIONS: BeverageSelections = {
  Cocktails: [
    {
      name: 'The Limelight',
      ingredients: 'Blanco tequila, fresh lime, orange liqueur, agave, salted rim',
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
  Mocktails: [
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
  Wine: ['Red', 'White', 'Rosé', 'Surprise Me'],
  Beer: ['IPA', 'Lager', 'Wheat', 'Non-Alcoholic Beer', 'Surprise Me'],
  'Non-Alcoholic': [],
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

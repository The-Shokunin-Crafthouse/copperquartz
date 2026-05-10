'use client';

import type { Guest } from '../state';
import {
  BEVERAGE_CATEGORIES,
  BEVERAGE_SELECTIONS,
  type BeverageCategory,
  type BeverageOption,
} from '../state';
import styles from '../rsvp.module.css';

export default function StepBeverage({
  guest,
  index,
  total,
  category,
  selection,
  onCategory,
  onSelection,
  onContinue,
  onBack,
}: {
  guest: Guest;
  index: number;
  total: number;
  category: string;
  selection: string | null;
  onCategory: (next: BeverageCategory) => void;
  onSelection: (next: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const validCategory = (BEVERAGE_CATEGORIES as readonly string[]).includes(
    category,
  )
    ? (category as BeverageCategory)
    : null;
  const usesCards =
    validCategory === 'Cocktails' || validCategory === 'Mocktails';
  const optionCount = validCategory
    ? BEVERAGE_SELECTIONS[validCategory].length
    : 0;
  const requiresSelection = validCategory !== null && optionCount > 0;
  const continueEnabled =
    validCategory !== null && (!requiresSelection || selection !== null);

  return (
    <div className={styles.stepShell}>
      <div className={styles.stepHeadingGroup}>
        <h2 className={styles.stepHeading}>
          {guest.first_name}&apos;s drink of choice
        </h2>
        <p className={styles.stepBody}>
          Please let us know your beverage of choice.
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.label}>Category</span>
        <div className={styles.pillGroup} role="radiogroup" aria-label="Beverage category">
          {BEVERAGE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              role="radio"
              aria-checked={validCategory === cat}
              data-selected={validCategory === cat}
              className={styles.pill}
              onClick={() => onCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.beverageSelectionSlot}>
        {requiresSelection && validCategory !== null && (
          <>
            <span className={styles.label}>Type</span>
            {usesCards ? (
              <div
                className={styles.optionCardGroup}
                role="radiogroup"
                aria-label="Beverage selection"
              >
                {(
                  BEVERAGE_SELECTIONS[validCategory] as BeverageOption[]
                ).map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    role="radio"
                    aria-checked={selection === opt.name}
                    data-selected={selection === opt.name}
                    className={styles.optionCard}
                    onClick={() => onSelection(opt.name)}
                  >
                    <span className={styles.optionCardName}>{opt.name}</span>
                    <span className={styles.optionCardIngredients}>
                      {opt.ingredients}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div
                className={styles.pillGroup}
                role="radiogroup"
                aria-label="Beverage selection"
              >
                {(BEVERAGE_SELECTIONS[validCategory] as string[]).map((sel) => (
                  <button
                    key={sel}
                    type="button"
                    role="radio"
                    aria-checked={selection === sel}
                    data-selected={selection === sel}
                    className={styles.pill}
                    onClick={() => onSelection(sel)}
                  >
                    {sel}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.back} onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={!continueEnabled}
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

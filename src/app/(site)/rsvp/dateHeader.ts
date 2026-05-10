/*
 * Date helpers shared by the wizard header + Confirmation. Pure, no
 * runtime deps — both server and client can call them.
 */

export const WEDDING_DATE_ROMAN = 'IX.XXIX.MMXXVI';
export const WEDDING_LOCATION = 'Santa Barbara';

const MS_PER_DAY = 86_400_000;

export function daysUntilWedding(now: Date = new Date()): number {
  const wedding = new Date('2026-09-29T00:00:00-07:00');
  return Math.floor((wedding.getTime() - now.getTime()) / MS_PER_DAY);
}

export function countdownLabel(days: number): string | null {
  if (days < 0) return null;
  if (days === 0) return 'Wedding day!';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

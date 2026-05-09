import type { Contribution } from './types';
import { formatUsdWhole } from './format';
import styles from './SummaryCards.module.css';

type Summary = {
  label: string;
  headline: string;
};

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function summarize(rows: Contribution[]): Summary[] {
  const honeymoon = rows.filter((r) => !r.self_reported && r.fund === 'honeymoon');
  const kiva = rows.filter((r) => !r.self_reported && r.fund === 'kiva');
  const hdmg = rows.filter((r) => r.self_reported && r.fund === 'howlin-dog');

  const honeymoonTotal = honeymoon.reduce((s, r) => s + r.amount_cents, 0);
  const kivaTotal = kiva.reduce((s, r) => s + r.amount_cents, 0);
  const hdmgTotal = hdmg.reduce((s, r) => s + r.amount_cents, 0);
  const kivaBorrower = kiva.filter((r) => !r.lenders_choice).length;

  return [
    {
      label: 'Honeymoon Fund',
      headline: `${formatUsdWhole(honeymoonTotal)} · ${honeymoon.length} ${pluralize(honeymoon.length, 'contribution', 'contributions')}`,
    },
    {
      label: 'Kiva',
      headline: `${formatUsdWhole(kivaTotal)} · ${kiva.length} ${pluralize(kiva.length, 'contribution', 'contributions')} (${kivaBorrower} chose a borrower)`,
    },
    {
      label: 'Howlin Dog Music Group',
      headline: `${formatUsdWhole(hdmgTotal)} · ${hdmg.length} self-reported`,
    },
  ];
}

export default function SummaryCards({ rows }: { rows: Contribution[] }) {
  const cards = summarize(rows);

  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <article key={card.label} className={styles.card}>
          <p className={styles.label}>{card.label}</p>
          <p className={styles.headline}>{card.headline}</p>
        </article>
      ))}
    </div>
  );
}

import type { AdminRsvpSummary } from '@/src/app/actions/getAdminRsvpSummary';
import styles from './SummaryCards.module.css';

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

export default function RsvpSummaryCards({
  summary,
}: {
  summary: AdminRsvpSummary;
}) {
  const declining = summary.declining_guests.length;
  const awaiting = Math.max(
    summary.total_invited - summary.attending_count - declining,
    0,
  );

  const cards = [
    {
      label: 'Total Invited',
      amount: String(summary.total_invited),
      detail: `${summary.total_invited} ${pluralize(summary.total_invited, 'guest', 'guests')} on the list`,
    },
    {
      label: 'Attending',
      amount: String(summary.attending_count),
      detail: `${declining} declined so far`,
    },
    {
      label: 'Awaiting Response',
      amount: String(awaiting),
      detail: `${awaiting} not yet responded`,
    },
  ];

  return (
    <div className={styles.cards}>
      {cards.map((card) => (
        <article key={card.label} className={styles.card}>
          <p className={styles.label}>{card.label}</p>
          <p className={styles.amount}>{card.amount}</p>
          <p className={styles.detail}>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

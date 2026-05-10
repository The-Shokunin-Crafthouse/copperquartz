import cardStyles from './SummaryCards.module.css';
import styles from './AdminStatRow.module.css';

type Card = {
  label: string;
  amount: string;
  detail: string;
};

export default function AdminStatRow({
  mondayCount,
  transportCount,
}: {
  mondayCount: number;
  transportCount: number;
}) {
  const cards: Card[] = [
    {
      label: 'Monday Meetup',
      amount: String(mondayCount),
      detail: `${mondayCount} joining Monday night`,
    },
    {
      label: 'Transportation',
      amount: String(transportCount),
      detail: `${transportCount} need a ride`,
    },
  ];

  return (
    <div className={styles.row}>
      {cards.map((card) => (
        <article key={card.label} className={cardStyles.card}>
          <p className={cardStyles.label}>{card.label}</p>
          <p className={cardStyles.amount}>{card.amount}</p>
          <p className={cardStyles.detail}>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

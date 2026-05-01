import styles from './InfoItem.module.css';

type InfoItemProps = {
  label: string;
  value: React.ReactNode;
  /** Pin the value column to a fixed width (matches Figma footer item width). */
  fixedWidth?: boolean;
};

/*
 * Footer column item — gold pillar on the left, label/value stack on the
 * right. Mirrors the Save the Date `.infoCol` so the two pages share one
 * visual vocabulary for footer info.
 */
export default function InfoItem({ label, value, fixedWidth = true }: InfoItemProps) {
  return (
    <div className={styles.item}>
      <div className={styles.pillar} aria-hidden />
      <div
        className={`${styles.stack} ${fixedWidth ? styles.stackFixed : ''}`}
      >
        <p className={styles.label}>{label}</p>
        <p className={styles.value}>{value}</p>
      </div>
    </div>
  );
}

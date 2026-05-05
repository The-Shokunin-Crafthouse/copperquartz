import styles from './InfoItem.module.css';

type InfoItemProps = {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Pin the value column to a fixed width (matches Figma footer item width). */
  fixedWidth?: boolean;
  /** External URL — wraps the entire label + value stack as a single
   *  link opening in a new tab. Used for CEREMONY and RECEPTION footer
   *  items pointing at Google Maps locations. */
  href?: string;
};

/*
 * Footer column item — gold pillar on the left, label/value stack on the
 * right. When `href` is set, the whole stack becomes a single anchor so
 * both the label (e.g. "CEREMONY") and the value (e.g. "Sunken Garden")
 * navigate to the linked location together.
 */
export default function InfoItem({
  label,
  value,
  fixedWidth = true,
  href,
}: InfoItemProps) {
  const content = (
    <>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
    </>
  );

  return (
    <div className={styles.item}>
      <div className={styles.pillar} aria-hidden />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.stackLink} ${fixedWidth ? styles.stackFixed : ''}`}
        >
          {content}
        </a>
      ) : (
        <div className={`${styles.stack} ${fixedWidth ? styles.stackFixed : ''}`}>
          {content}
        </div>
      )}
    </div>
  );
}

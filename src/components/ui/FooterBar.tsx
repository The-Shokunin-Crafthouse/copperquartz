import InfoItem from './InfoItem';
import styles from './FooterBar.module.css';

type Item = { label: string; value: string };

type FooterBarProps = {
  items: Item[];
};

export default function FooterBar({ items }: FooterBarProps) {
  return (
    <footer className={styles.footer}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.label} className={styles.item}>
            <InfoItem label={item.label} value={item.value} />
          </li>
        ))}
      </ul>
    </footer>
  );
}

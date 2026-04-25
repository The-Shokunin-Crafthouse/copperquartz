import styles from './RSVPButton.module.css';

type RSVPButtonProps = {
  href: string;
  label: string;
  disabled?: boolean;
};

export default function RSVPButton({ href, label, disabled = false }: RSVPButtonProps) {
  if (disabled) {
    return (
      <span className={styles.button} role="link" aria-disabled="true">
        {label}
      </span>
    );
  }

  return (
    <a href={href} className={styles.button}>
      {label}
    </a>
  );
}

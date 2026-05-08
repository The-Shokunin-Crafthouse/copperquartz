import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Heart } from '@phosphor-icons/react/dist/ssr/Heart';
import styles from './RegistryButton.module.css';

type IconKind = 'heart' | undefined;

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  children: ReactNode;
  icon?: IconKind;
};

/*
 * Registry CTA. Stripe wiring lands next sprint — this ships the visual
 * vocabulary (default / hover / focus / active / disabled) ready for an
 * `onClick` handler to be added without restyle.
 *
 * `aria-disabled` honored alongside native `disabled` so the page can
 * disable a CTA without removing it from the focus order if it ever
 * needs to (per studio-memory accumulated learning, 2026-04-26).
 */
export default function RegistryButton({
  children,
  icon,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button {...rest} type={type} className={styles.button}>
      <span>{children}</span>
      {icon === 'heart' ? (
        <span className={styles.icon} aria-hidden>
          <Heart size={17} weight="regular" />
        </span>
      ) : null}
    </button>
  );
}

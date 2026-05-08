import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { withBase } from '@/src/lib/paths';
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
 * The heart icon is rendered as a CSS mask of the local
 * `public/images/svg/heart.svg` glyph rather than a Phosphor component
 * so the wedding-site keeps a single, explicit icon source. Mask + a
 * `currentColor` background means the icon recolors with the surrounding
 * text on hover / disabled / etc. without a separate SVG asset per
 * theme.
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
        <span
          className={styles.icon}
          style={
            {
              '--icon-mask-image': `url(${withBase('/images/svg/heart.svg')})`,
            } as React.CSSProperties
          }
          aria-hidden
        />
      ) : null}
    </button>
  );
}

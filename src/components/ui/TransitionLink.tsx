'use client';

import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children: ReactNode;
  };

/*
 * Internal navigation that opts into the View Transitions API when the
 * browser supports it. The same-document transition lets PageBackdrop's
 * coastal/courthouse slide out and the main content cross-fade with the
 * incoming page (animations live in PageBackdrop.module.css and
 * (site)/layout.module.css under ::view-transition-* selectors).
 *
 * Browsers without startViewTransition (currently Firefox without a
 * flag) fall back to a normal client-side route push — no animation,
 * no error.
 */
export default function TransitionLink({
  href,
  onClick,
  children,
  ...rest
}: Props) {
  const router = useRouter();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const target = typeof href === 'string' ? href : href.pathname ?? '';
    if (!target || target.startsWith('http') || target.startsWith('#')) return;

    const startViewTransition = (
      document as Document & { startViewTransition?: (cb: () => void) => unknown }
    ).startViewTransition;
    if (typeof startViewTransition === 'function') {
      e.preventDefault();
      startViewTransition.call(document, () => router.push(target));
    }
  };

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}

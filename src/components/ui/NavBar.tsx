'use client';

import { useEffect, useState } from 'react';
import RSVPButton from './RSVPButton';
import styles from './NavBar.module.css';

type NavLink = { label: string; href: string };

type NavBarProps = {
  links: NavLink[];
  rsvpHref: string;
};

export default function NavBar({ links, rsvpHref }: NavBarProps) {
  const [open, setOpen] = useState(false);

  /* Close drawer on Escape — keyboard parity with the menu button. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={styles.navBar} data-open={open || undefined}>
      <button
        type="button"
        className={styles.hamburger}
        aria-expanded={open}
        aria-controls="site-nav-links"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.hamburgerLine} aria-hidden />
        <span className={styles.hamburgerLine} aria-hidden />
        <span className={styles.hamburgerLine} aria-hidden />
      </button>

      <nav
        id="site-nav-links"
        className={styles.links}
        aria-label="Primary"
      >
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={styles.link}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className={styles.rsvp}>
        <RSVPButton href={rsvpHref} label="RSVP" />
      </div>
    </header>
  );
}

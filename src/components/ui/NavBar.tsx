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

  /* Close drawer on Escape; lock body scroll while open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header className={styles.navBar} data-open={open || undefined}>
      <button
        type="button"
        className={styles.menuToggle}
        aria-expanded={open}
        aria-controls="site-nav-links"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'CLOSE' : 'MENU'}
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

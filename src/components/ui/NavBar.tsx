'use client';

import { useState } from 'react';
import RSVPButton from './RSVPButton';
import styles from './NavBar.module.css';

type NavLink = { label: string; href: string };

type NavBarProps = {
  links: NavLink[];
  rsvpHref: string;
};

export default function NavBar({ links, rsvpHref }: NavBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.navBar}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.hamburger}
          aria-expanded={open}
          aria-controls="navbar-links"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>

      <nav
        id="navbar-links"
        className={`${styles.links} ${open ? styles.linksOpen : ''}`}
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} className={styles.link}>
            {link.label}
          </a>
        ))}
      </nav>

      <div className={styles.right}>
        <RSVPButton href={rsvpHref} label="RSVP" />
      </div>
    </header>
  );
}

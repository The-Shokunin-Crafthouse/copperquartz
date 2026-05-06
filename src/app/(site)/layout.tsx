import NavBar from '@/src/components/ui/NavBar';
import FooterBar from '@/src/components/ui/FooterBar';
import PageBackdrop from '@/src/components/ui/PageBackdrop';
import styles from './layout.module.css';

const NAV_LINKS = [
  { label: 'Our Story', href: '/our-story' },
  { label: 'Venue', href: '/venue' },
  { label: 'Travel', href: '/travel' },
  { label: 'Registry', href: '/registry' },
  { label: 'Q&A', href: '/qa' },
];

const RSVP_HREF = '/rsvp';
const WEDDING_DATE = '2026-09-29';

/*
 * Marketing-site layout (route group `(site)`). Wraps Home and the four
 * future content pages in shared chrome: fixed PageBackdrop + sticky-feel
 * NavBar + FooterBar with the build-time countdown. The /savethedate
 * page intentionally does not inherit this — it lives outside the group
 * with its own self-contained layout.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell} data-scroll-root>
      <PageBackdrop />
      <NavBar links={NAV_LINKS} rsvpHref={RSVP_HREF} />
      <main className={styles.main}>{children}</main>
      <FooterBar weddingDate={WEDDING_DATE} rsvpHref={RSVP_HREF} />
    </div>
  );
}

import { withBase } from '@/src/lib/paths';
import styles from './page.module.css';

/*
 * Home — hero lockup + invitation line. Backdrop, nav, and footer come
 * from the (site) route-group layout. Figma frame 22:988.
 */
export default function HomePage() {
  return (
    <section className={styles.home}>
      <h1 className={styles.heroLockup}>
        <img
          className={styles.heroImg}
          src={withBase('/images/svg/Levi & Meghan - homepage.svg')}
          alt="Levi & Meghan"
        />
      </h1>
      <p className={styles.body}>
        Request the honor of your presence. An evening under palms, in good
        company, with the ocean near.
      </p>
    </section>
  );
}

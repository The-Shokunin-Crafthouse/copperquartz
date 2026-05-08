import RegistryTile, { type TileCrop } from '@/src/components/ui/RegistryTile';
import styles from './page.module.css';

/*
 * Registry — Figma frames 22:1243 (desktop) and 113:128 (mobile w/
 * overlay). Each tile carries a Figma-exact crop spec per breakpoint
 * so the visible window matches the design at every viewport. Mobile
 * crops zoom further into the photo than object-fit cover would
 * (Figma sets image width to ~136–160% of the column on mobile).
 *
 * CTAs are visual-only this sprint; Stripe checkout wires next sprint
 * by replacing each `RegistryButton` onClick.
 */
export const metadata = {
  title: 'Registry — Levi & Meghan',
  description:
    'If you wish to give beyond your presence — honeymoon contributions, Howlin’ Dog Music Group, and Kiva micro-loans.',
};

/* Honeymoon — image 1200×960. Desktop tile 810×340 (aspect 2.382:1);
   mobile tile 354×236 (aspect 1.5:1). Image scaled larger than cover
   on both breakpoints and shifted up so the visible window centers
   on the treehouse bar (mid-photo). */
const HONEYMOON_DESKTOP: TileCrop = {
  aspect: '810 / 340',
  imageW: '103.08%',
  imageLeft: '-1.54%',
  imageTop: '-77.92%',
};
const HONEYMOON_MOBILE: TileCrop = {
  aspect: '354 / 236',
  imageW: '159.64%',
  imageLeft: '-7.89%',
  imageTop: '-73.96%',
};

/* Howlin' Dog — image 1053×513 (vinyl + landscape composition).
   Desktop 810×280; mobile 354×236. Image slightly wider than column
   on both, shifted left so the vinyl record + Howlin' Dog wordmark
   centers in the visible window. */
const HDMG_DESKTOP: TileCrop = {
  aspect: '810 / 280',
  imageW: '107.16%',
  imageLeft: '-4.32%',
  imageTop: '-28.21%',
};
const HDMG_MOBILE: TileCrop = {
  aspect: '354 / 236',
  imageW: '136.72%',
  imageLeft: '-19.77%',
  imageTop: '0%',
};

/* Kiva — image 1200×513 (terraced fields, kiva wordmark baked in).
   Desktop 810×280; mobile 354×236. Mobile zooms ~156% so the kiva
   wordmark fills the frame the way Figma stages it. */
const KIVA_DESKTOP: TileCrop = {
  aspect: '810 / 280',
  imageW: '100%',
  imageLeft: '0%',
  imageTop: '-11.79%',
};
const KIVA_MOBILE: TileCrop = {
  aspect: '354 / 236',
  imageW: '155.94%',
  imageLeft: '-27.97%',
  imageTop: '0%',
};

export default function RegistryPage() {
  return (
    <article className={styles.registry}>
      <h2 className={styles.heading}>Our Registry</h2>

      <p className={styles.intro}>
        While your presence is most important to us, if you wish to give
        further, consider our options below.
      </p>

      <div className={styles.sections}>
        <section className={styles.section} aria-labelledby="registry-personal">
          <h3 id="registry-personal" className={styles.eyebrow}>
            Personal
          </h3>
          <div className={styles.tiles}>
            <RegistryTile
              imageSrc="/images/honeymoon.jpg"
              imageAlt="Tropical resort with palm trees and a thatched-roof bar at dusk"
              logoSrc="/images/honeymoon.svg"
              logoAlt=""
              desktopCrop={HONEYMOON_DESKTOP}
              mobileCrop={HONEYMOON_MOBILE}
              desktopLogoWidth="68%"
              mobileLogoWidth="87%"
              overlayCopy="Help us enjoy our Honeymoon even more by contributing to our extra adventures fund."
              ctaLabel="Gift"
              ctaIcon="heart"
              ctaAriaLabel="Gift toward our honeymoon adventures fund"
            />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="registry-charities">
          <h3 id="registry-charities" className={styles.eyebrow}>
            Charities
          </h3>
          <div className={styles.tiles}>
            <RegistryTile
              imageSrc="/images/hdmg.jpg"
              imageAlt="Howlin’ Dog Music Group — vinyl record over a desert horizon at dusk"
              desktopCrop={HDMG_DESKTOP}
              mobileCrop={HDMG_MOBILE}
              overlayCopy="Help artists fund the recording of their next album."
              ctaLabel="Donate"
              ctaAriaLabel="Donate to Howlin’ Dog Music Group"
            />
            <RegistryTile
              imageSrc="/images/kiva.jpg"
              imageAlt="Kiva — terraced rice paddies with palms and a rainbow at the horizon"
              desktopCrop={KIVA_DESKTOP}
              mobileCrop={KIVA_MOBILE}
              overlayCopy="Donate a loan to help small business all over the world."
              ctaLabel="Donate"
              ctaAriaLabel="Donate to Kiva micro-loans"
            />
          </div>
        </section>
      </div>
    </article>
  );
}

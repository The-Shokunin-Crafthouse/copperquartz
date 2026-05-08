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

/* Honeymoon — wordmark is baked into the source files at the right
   framing per breakpoint. honeymoon-desktop.jpg is 1540×680 (2× of
   770×340), honeymoon-mobile.jpg is 708×472 (2× of 354×236). Because
   the source already matches the tile aspect exactly, the crop spec
   is full-bleed: 100% width, no offsets. <picture> swaps the two
   files at min-width: 769px. */
const HONEYMOON_DESKTOP: TileCrop = {
  aspect: '770 / 340',
  imageW: '100%',
  imageLeft: '0%',
  imageTop: '0%',
};
const HONEYMOON_MOBILE: TileCrop = {
  aspect: '354 / 236',
  imageW: '100%',
  imageLeft: '0%',
  imageTop: '0%',
};

/* HDMG and Kiva — same per-breakpoint baked-in pattern as Honeymoon.
   Desktop sources are 1540×560 (2× of 770×280); mobile sources are
   708×472 (2× of 354×236). Each file is already framed for its tile,
   so the crop spec is full-bleed on both breakpoints. */
const HDMG_DESKTOP: TileCrop = {
  aspect: '770 / 280',
  imageW: '100%',
  imageLeft: '0%',
  imageTop: '0%',
};
const HDMG_MOBILE: TileCrop = {
  aspect: '354 / 236',
  imageW: '100%',
  imageLeft: '0%',
  imageTop: '0%',
};

const KIVA_DESKTOP: TileCrop = {
  aspect: '770 / 280',
  imageW: '100%',
  imageLeft: '0%',
  imageTop: '0%',
};
const KIVA_MOBILE: TileCrop = {
  aspect: '354 / 236',
  imageW: '100%',
  imageLeft: '0%',
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
              imageSrc="/images/honeymoon-desktop.jpg"
              imageSrcMobile="/images/honeymoon-mobile.jpg"
              imageAlt="Honeymoon — bamboo treehouse villa nestled in a tropical jungle canopy"
              desktopCrop={HONEYMOON_DESKTOP}
              mobileCrop={HONEYMOON_MOBILE}
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
              imageSrc="/images/hdmg-desktop.jpg"
              imageSrcMobile="/images/hdmg-mobile.jpg"
              imageAlt="Howlin’ Dog Music Group — vinyl record over a desert horizon at dusk"
              desktopCrop={HDMG_DESKTOP}
              mobileCrop={HDMG_MOBILE}
              overlayCopy="Help artists fund the recording of their next album."
              ctaLabel="Donate"
              ctaAriaLabel="Donate to Howlin’ Dog Music Group"
            />
            <RegistryTile
              imageSrc="/images/kiva-desktop.jpg"
              imageSrcMobile="/images/kiva-mobile.jpg"
              imageAlt="Kiva — terraced rice paddies with palms and a rainbow at the horizon"
              desktopCrop={KIVA_DESKTOP}
              mobileCrop={KIVA_MOBILE}
              overlayCopy="Donate a loan to help small business owners all over the world."
              ctaLabel="Donate"
              ctaAriaLabel="Donate to Kiva micro-loans"
            />
          </div>
        </section>
      </div>
    </article>
  );
}

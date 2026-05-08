import RegistryTile from '@/src/components/ui/RegistryTile';
import styles from './page.module.css';

/*
 * Registry — Figma frame 22:1243.
 *   - "Our Registry" hero (Cormorant SemiBold, palm-leaf).
 *   - One Personal tile (Honeymoon) + two Charities tiles
 *     (Howlin' Dog Music Group, Kiva). Each tile reveals a dark
 *     overlay panel on hover/tap with a single CTA.
 *   - CTAs are visual-only this sprint; Stripe checkout wires next
 *     sprint by wrapping/replacing each `RegistryButton` onClick.
 */
export const metadata = {
  title: 'Registry — Levi & Meghan',
  description:
    'If you wish to give beyond your presence — honeymoon contributions, Howlin’ Dog Music Group, and Kiva micro-loans.',
};

export default function RegistryPage() {
  return (
    <article className={styles.registry}>
      <h2 className={styles.heading}>Our Registry</h2>

      <p className={styles.intro}>
        While your presence is most important to us, if you wish to give
        further, consider our options below. We already have everything
        one could imagine, we don&rsquo;t need any more &ldquo;stuff&rdquo;.
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
              logoSrc="/images/svg/honeymoon.svg"
              logoAlt=""
              aspectRatio="810 / 320"
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
              imageSrc="/images/howlindog.jpg"
              imageAlt="Recording studio at sunset with palm trees in the foreground"
              aspectRatio="810 / 280"
              overlayCopy="Help artists fund the recording of their next album."
              ctaLabel="Donate"
              ctaAriaLabel="Donate to Howlin’ Dog Music Group"
            />
            <RegistryTile
              imageSrc="/images/kiva.jpg"
              imageAlt="Open countryside landscape under bright sky"
              aspectRatio="810 / 280"
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

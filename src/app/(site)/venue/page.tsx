import VideoFrame from '@/src/components/ui/VideoFrame';
import styles from './page.module.css';

/*
 * Venue — two sections per Figma frame 22:1119.
 *   1. Sunken Garden    — Ceremony 4:30pm   — video: sunken-garden.mp4
 *   2. Cabrillo Pavilion — Reception 5:30pm  — video: cabrillo-pavilion.mp4
 *
 * Composition mirrors /travel: heading → meta → media → body. Coral-rose
 * inline links (`.coral`) match the established address-link treatment.
 */
export const metadata = {
  title: 'Venue · Levi & Meghan',
  description:
    'Sunken Garden ceremony and Cabrillo Pavilion reception: Santa Barbara, September 29, 2026.',
};

export default function VenuePage() {
  return (
    <article className={styles.venue}>
      {/* ---------- Section 1: Sunken Garden ---------- */}
      <section className={styles.section} aria-labelledby="venue-sunken-garden">
        <h2 id="venue-sunken-garden" className={styles.heading}>
          Sunken Garden
        </h2>
        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Ceremony start time</dt>
            <dd>4:30pm</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Address</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://maps.app.goo.gl/EhCGDJbFNmd7U1PZ7"
                target="_blank"
                rel="noopener noreferrer"
              >
                1100 Anacapa St, Santa Barbara, CA 93101
              </a>
            </dd>
          </div>
        </dl>
        <VideoFrame
          src="/videos/sunken-garden.mp4"
          label="Santa Barbara County Courthouse Sunken Garden"
        />
        <div className={styles.body}>
          <p>
            The Santa Barbara County Courthouse is one of the city&rsquo;s most
            beloved landmarks, completed in 1929 after the 1925 earthquake
            reshaped much of downtown Santa Barbara. Designed in the
            Spanish-Moorish / Spanish Colonial Revival style, the courthouse
            reflects the city&rsquo;s signature red-tile roofs, graceful arches,
            hand-painted details, and romantic old-world character. It is still
            a working courthouse today, which makes it feel less like a
            preserved relic and more like a living part of Santa Barbara&rsquo;s
            history.
          </p>
          <p>
            Rising above the courthouse is the Clock Tower, also known as El
            Mirador, one of the best viewpoints in Santa Barbara. Inside the
            tower is a historic 1929 Seth Thomas tower clock, still part of the
            building&rsquo;s charm, along with the Bisno Schall Clock Gallery,
            which celebrates the history of timekeeping. From the top, guests
            can see the red-tiled rooftops of downtown, the Santa Ynez
            Mountains, and the Pacific beyond.
          </p>
          <p>
            The Sunken Garden, where we&rsquo;ll celebrate, sits on the site of
            the original 1872 courthouse. After the earthquake, the space was
            transformed into a lush garden surrounded by the courthouse&rsquo;s
            architecture, palms, lawns, and stone details. Over the years, it
            has become one of Santa Barbara&rsquo;s most iconic gathering
            places for civic events, performances, and weddings: a
            pretty fitting place to start our next chapter.
          </p>
        </div>
      </section>

      {/* ---------- Section 2: Cabrillo Pavilion ---------- */}
      <section className={styles.section} aria-labelledby="venue-cabrillo-pavilion">
        <h2 id="venue-cabrillo-pavilion" className={styles.heading}>
          Cabrillo Pavilion
        </h2>
        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Reception start time</dt>
            <dd>5:30pm</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Address</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://maps.app.goo.gl/bskDkRbPHhzQR8Bg6"
                target="_blank"
                rel="noopener noreferrer"
              >
                1118 E Cabrillo Blvd, Santa Barbara, CA 93103
              </a>
            </dd>
          </div>
        </dl>
        <VideoFrame
          src="/videos/cabrillo-pavilion.mp4"
          label="Cabrillo Pavilion at East Beach, Santa Barbara"
        />
        <div className={styles.body}>
          <p>
            The Cabrillo Pavilion is one of Santa Barbara&rsquo;s classic
            beachfront landmarks, built in 1926 shortly after the 1925
            earthquake helped reshape the city&rsquo;s architectural identity.
            Designed by Roland Sauter and E. Keith Lockard, the Pavilion
            reflects the Spanish Colonial Revival style that Santa Barbara is
            known for: white stucco walls, terra-cotta rooflines, arched
            details, and a graceful seaside presence along East Beach.
          </p>
          <p>
            The building exists largely because of local philanthropist David
            Gray, who funded it and donated it to the City of Santa Barbara in
            1927. Gray intended the Pavilion to serve the public, with two
            lasting conditions: that it remain self-sustaining and continue to
            support parks and recreation. Over the decades, it has served many
            roles, including a beach bathhouse, dance hall, community
            gathering place, arts center, event venue, and recreational
            facility.
          </p>
          <p>
            Today, the Cabrillo Pavilion remains a beloved piece of Santa
            Barbara&rsquo;s waterfront history. A major renovation restored
            and updated the building while preserving its historic character,
            allowing it to continue serving both locals and visitors as a
            place for recreation, celebrations, and community events. Set
            directly beside East Beach, it carries the easy elegance of old
            Santa Barbara: historic, coastal, unfussy, and quietly beautiful.
          </p>
        </div>
      </section>
    </article>
  );
}

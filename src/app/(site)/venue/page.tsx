import VideoFrame from '@/src/components/ui/VideoFrame';
import styles from './page.module.css';

/*
 * Venue — three sections, chronological across the wedding weekend.
 *   1. The Night Before  — Mon 6–8pm       — video: validation-ale.mp4
 *   2. Sunken Garden     — Ceremony 4:30pm — video: sunken-garden.mp4
 *   3. Cabrillo Pavilion — Reception 5:30pm — video: cabrillo-pavilion.mp4
 *
 * Sections 2–3 are the Figma frame 22:1119 pair. Section 1 was added after
 * the RSVP closed (the Monday meetup was an RSVP question with no public
 * home) and reuses the same composition verbatim: heading → meta → media →
 * body, coral-rose inline links (`.coral`), no new CSS. It carries a poster
 * because it is the only clip with a still worth showing before playback.
 */
export const metadata = {
  title: 'Venue · Levi & Meghan',
  description:
    'Monday meetup at Validation Ale, Sunken Garden ceremony, and Cabrillo Pavilion reception: Santa Barbara, September 28–29, 2026.',
};

export default function VenuePage() {
  return (
    <article className={styles.venue}>
      {/* ---------- Section 1: The Night Before ---------- */}
      <section className={styles.section} aria-labelledby="venue-night-before">
        <h2 id="venue-night-before" className={styles.heading}>
          The Night Before
        </h2>
        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>When</dt>
            <dd>Monday, September 28 &middot; 6:00&ndash;8:00pm</dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Address</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://maps.google.com/?q=102+E+Yanonali+St,+Santa+Barbara,+CA+93101"
                target="_blank"
                rel="noopener noreferrer"
              >
                102 E Yanonali St, Santa Barbara, CA 93101
              </a>
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Website</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://www.validationale.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                validationale.com
              </a>
            </dd>
          </div>
        </dl>
        <VideoFrame
          src="/videos/validation-ale.mp4"
          poster="/images/validation-ale.jpg"
          label="Validation Ale taproom in the Santa Barbara Funk Zone"
        />
        <div className={styles.body}>
          <p>
            For anyone in town early, we&rsquo;re gathering at Validation Ale
            the evening before the wedding. Nothing formal, no dress code,
            entirely optional. Stop in for an hour or stay the whole time, and
            food and drinks are available for purchase.
          </p>
          <p>
            Validation is a brewery and taproom in the Funk Zone, a few blocks
            off the waterfront, serving pizza and sandwiches alongside their
            own beer. The taproom&rsquo;s most-ordered pours get
            &ldquo;validated&rdquo; and earn a permanent tap, so the board
            shifts with whatever the room has been drinking. Much of the
            seating is outside, so bring a sweatshirt or a jacket &mdash;
            Santa Barbara cools off quickly once the sun drops.
          </p>
        </div>
      </section>

      {/* ---------- Section 2: Sunken Garden ---------- */}
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

      {/* ---------- Section 3: Cabrillo Pavilion ---------- */}
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

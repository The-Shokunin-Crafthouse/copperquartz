import { withBase } from '@/src/lib/paths';
import VideoFrame from '@/src/components/ui/VideoFrame';
import styles from './page.module.css';

/*
 * Travel — three sections per Figma frame 22:1181.
 *   1. Fly like a bird   — Airports (SBA + LAX)         — image: sba.jpg
 *   2. Hotel Accommodations — Mar Monte Hyatt           — video: mar-monte.mp4
 *   3. Things to do      — Santa Barbara recs            — video: santa-barbara.mp4
 *
 * Pink-coral inline links use class `.coral`. All hrefs supplied by the
 * couple. SBA section is a static image (no airport video in /videos).
 */
export const metadata = {
  title: 'Travel — Levi & Meghan',
  description:
    'Getting to Santa Barbara — flights, hotel, and what to do once you arrive.',
};

export default function TravelPage() {
  return (
    <article className={styles.travel}>
      {/* ---------- Section 1: Airports ---------- */}
      <section className={styles.section} aria-labelledby="travel-airports">
        <h2 id="travel-airports" className={styles.heading}>
          Fly like a bird
        </h2>
        <p className={styles.body}>
          <span className={styles.eyebrow}>Airports</span>
          <span className={styles.label}>Santa Barbara Airport (SBA):</span>{' '}
          served by 5 main airlines providing direct access to major hubs:
          Alaska, American, Delta, Southwest, and United. It is located 15–20
          min to downtown so you can easily Uber to your lodging accommodations.
        </p>
        <img
          className={styles.mediaImage}
          src={withBase('/images/sba.jpg')}
          alt="Santa Barbara Airport tarmac with mountains beyond."
          loading="lazy"
        />
        <p className={styles.body}>
          <span className={styles.label}>Los Angeles Airport (LAX):</span>{' '}
          Enjoy a beautiful drive up the Pacific Coast Highway if you plan on
          renting a car or take a bus directly from the airport to downtown
          Santa Barbara via{' '}
          <a
            className={styles.coral}
            href="https://www.sbairbus.com/lax-shuttle-schedule-fares/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Santa Barbara Airbus
          </a>
          .
        </p>
      </section>

      {/* ---------- Section 2: Hotel Accommodations ---------- */}
      <section className={styles.section} aria-labelledby="travel-hotel">
        <h2 id="travel-hotel" className={styles.heading}>
          Hotel Accommodations
        </h2>
        <p className={styles.body}>
          <span className={styles.label}>Mar Monte Hyatt:</span>{' '}
          <a
            className={styles.coral}
            href="https://www.hyatt.com/events/en-US/group-booking/SBARS/G-BAHN"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book your room with our discount, $200 off
          </a>
          <br />
          <span className={styles.label}>Address:</span>{' '}
          <a
            className={styles.coral}
            href="https://maps.app.goo.gl/RPGXMm2QDShZS7qi6"
            target="_blank"
            rel="noopener noreferrer"
          >
            1111 East Cabrillo Boulevard, Santa Barbara, CA 93103
          </a>
          <br />
          <span className={styles.label}>Website:</span>{' '}
          <a
            className={styles.coral}
            href="https://marmontehotel.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://marmontehotel.com/
          </a>
          <br />
          This hotel is directly across the street from the reception and
          where the bride and groom will be staying. There is limited
          availability so please reach out if you wish to stay here and they
          are no longer available.
        </p>
        <VideoFrame
          src="/videos/mar-monte.mp4"
          label="Mar Monte Hyatt aerial view"
        />
        <p className={styles.body}>
          <span className={styles.label}>Note:</span>{' '}
          We are still working on a cheaper hotel room block and will add
          that here if that becomes available.
        </p>
      </section>

      {/* ---------- Section 3: Things to do ---------- */}
      <section className={styles.section} aria-labelledby="travel-things-to-do">
        <h2 id="travel-things-to-do" className={styles.heading}>
          Things to do
        </h2>
        <p className={styles.body}>
          Besides using ChatGPT to find your own adventure, we recommend the{' '}
          <a
            className={styles.coral}
            href="https://www.grassinifamilyvineyards.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Grassini Family Vineyards
          </a>
          , the{' '}
          <a
            className={styles.coral}
            href="https://www.santabarbara.com/activities/beaches/santa-barbara/thousand-steps-beach/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Thousand Steps Beach
          </a>
          , a meal at{' '}
          <a
            className={styles.coral}
            href="https://boathousesb.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Boathouse at Hendry&rsquo;s Beach
          </a>{' '}
          and stroll along the beach (say hi to my Dad for me, he would
          of loved to meet everyone),{' '}
          <a
            className={styles.coral}
            href="https://stearnswharf.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stearns Wharf
          </a>{' '}
          at Pier, a boat tour on the{' '}
          <a
            className={styles.coral}
            href="https://liltootsb.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Lil&rsquo; Toot
          </a>
          , or catch a show at the{' '}
          <a
            className={styles.coral}
            href="https://sbbowl.com/photos/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Santa Barbara Bowl
          </a>
          , plus a million more things on their{' '}
          <a
            className={styles.coral}
            href="https://santabarbaraca.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            official site
          </a>
          .
        </p>
        <VideoFrame
          src="/videos/santa-barbara.mp4"
          label="Santa Barbara County Courthouse and downtown"
        />
      </section>
    </article>
  );
}

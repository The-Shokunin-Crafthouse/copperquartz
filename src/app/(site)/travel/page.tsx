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
          <span className={styles.label}>Mar Monte Hyatt</span>
        </p>
        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Booking</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://www.hyatt.com/events/en-US/group-booking/SBARS/G-BAHN"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book your room with our discount, $200 off
              </a>
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Address</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://maps.app.goo.gl/RPGXMm2QDShZS7qi6"
                target="_blank"
                rel="noopener noreferrer"
              >
                1111 East Cabrillo Boulevard, Santa Barbara, CA 93103
              </a>
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Website</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://marmontehotel.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                marmontehotel.com
              </a>
            </dd>
          </div>
        </dl>
        <p className={styles.body}>
          This hotel is directly across the street from the reception and
          where the bride and groom will be staying. There is limited
          availability so please reach out if you wish to stay here and they
          are no longer available.
        </p>
        <div className={styles.hotelMedia}>
          <VideoFrame
            src="/videos/mar-monte.mp4"
            label="Mar Monte Hyatt aerial view"
            objectPosition="center bottom"
          />
        </div>
        <p className={styles.body}>
          <span className={styles.label}>Cabrillo Inn</span>
        </p>
        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Booking</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://hotels.cloudbeds.com/en/reservation/cksufF/?currency=usd&checkin=2026-09-28&checkout=2026-09-30&adults=2&rid=290024"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book your room
              </a>{' '}
              <span className={styles.metaInline}>
                — add &ldquo;returning guest discount&rdquo; in the notes
              </span>
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Address</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://maps.app.goo.gl/5mQAfp2qjKUcRucv8"
                target="_blank"
                rel="noopener noreferrer"
              >
                931 E Cabrillo Blvd, Santa Barbara, CA 93103
              </a>
            </dd>
          </div>
          <div className={styles.metaRow}>
            <dt>Website</dt>
            <dd>
              <a
                className={styles.coral}
                href="https://cabrilloinn.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                cabrilloinn.com
              </a>{' '}
              <span className={styles.metaInline}>
                (currently down)
              </span>
            </dd>
          </div>
        </dl>
        <p className={styles.body}>
          A 4-minute walk from the reception venue. They don&rsquo;t offer a
          room block, but my Aunt arranged a cheaper rate with the manager:
          a Deluxe Ocean View (two queens or one king) for $199/night, or a
          standard king for $144/night. Make sure to add &ldquo;
          <span className={styles.label}>returning guest discount</span>
          &rdquo; in the notes section before checkout.
        </p>
        <div className={styles.hotelMedia}>
          <img
            className={styles.mediaImage}
            src={withBase('/images/cabrillo-inn.jpeg')}
            alt="Cabrillo Inn courtyard with palm trees and ocean view."
            loading="lazy"
          />
        </div>
        <p className={styles.body}>
          <span className={styles.label}>Note:</span>{' '}
          We are still working on a cheaper hotel room block and will add
          that here if that becomes available. There are a ton of places
          to stay however if you want to be closer to the courthouse and
          plan to walk State street while you are here.
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

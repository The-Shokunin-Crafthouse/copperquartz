import Image from 'next/image';
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
  title: 'Travel · Levi & Meghan',
  description:
    'Getting to Santa Barbara: flights, hotel, and what to do once you arrive.',
};

export default function TravelPage() {
  return (
    <article className={styles.travel}>
      {/* ---------- Section 1: Airports ---------- */}
      <section className={styles.section} aria-labelledby="travel-airports">
        <h2 id="travel-airports" className={styles.heading}>
          Fly like a bird
        </h2>
        <div className={styles.body}>
          <p>
            <span className={styles.eyebrow}>Airports</span>
            <span className={styles.label}>Santa Barbara Airport (SBA):</span>{' '}
            served by 5 main airlines providing direct access to major hubs:
            Alaska, American, Delta, Southwest, and United. It is located 15–20
            min to downtown so you can easily Uber to your lodging accommodations.
          </p>
        </div>
        <Image
          className={styles.mediaImage}
          src={withBase('/images/sba.jpg')}
          alt="Santa Barbara Airport tarmac with mountains beyond."
          width={3936}
          height={2213}
          loading="lazy"
        />
        <div className={styles.body}>
          <p>
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
        </div>
      </section>

      {/* ---------- Section 2: Hotel Accommodations ---------- */}
      <section className={styles.section} aria-labelledby="travel-hotel">
        <h2 id="travel-hotel" className={styles.heading}>
          Hotel Accommodations
        </h2>
        <div className={styles.body}>
          <p>
            <span className={styles.label}>Mar Monte Hyatt</span>
          </p>
        </div>
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
        <div className={styles.body}>
          <p>
            This hotel is directly across the street from the reception and
            where the bride and groom will be staying. There is limited
            availability so please reach out if you wish to stay here and they
            are no longer available.
          </p>
        </div>
        <div className={styles.hotelMedia}>
          <VideoFrame
            src="/videos/mar-monte.mp4"
            label="Mar Monte Hyatt aerial view"
            objectPosition="center bottom"
          />
        </div>
        <div className={styles.body}>
          <p>
            <span className={styles.label}>Cabrillo Inn</span>
          </p>
        </div>
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
                (add &ldquo;returning guest discount&rdquo; in the notes)
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
        <div className={styles.body}>
          <p>
            A 4-minute walk from the reception venue. They don&rsquo;t offer a
            room block, but my Aunt arranged a cheaper rate with the manager:
            a Deluxe Ocean View (two queens or one king) for $199/night, or a
            standard king for $144/night. Make sure to add &ldquo;
            <span className={styles.label}>returning guest discount</span>
            &rdquo; in the notes section before checkout.
          </p>
        </div>
        <div className={styles.hotelMedia}>
          <Image
            className={styles.mediaImage}
            src={withBase('/images/cabrillo-inn.jpeg')}
            alt="Cabrillo Inn courtyard with palm trees and ocean view."
            width={1360}
            height={680}
            loading="lazy"
          />
        </div>
        <div className={styles.body}>
          <p>
            <span className={styles.label}>Note:</span>{' '}
            We are still working on a cheaper hotel room block and will add
            that here if that becomes available. If you want to be close to
            the action, a short walk to the Courthouse and State Street,
            these are our picks.
          </p>
        </div>
      </section>

      {/* ---------- Section 3: Local Recommendations ---------- */}
      <section className={styles.section} aria-labelledby="travel-recs">
        <h2 id="travel-recs" className={styles.heading}>
          Local Recommendations
        </h2>
        <div className={styles.body}>
          <p>
            Besides using ChatGPT to find your own adventure, here are our
            picks, and a million more wait on the{' '}
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
        </div>

        <VideoFrame
          src="/videos/santa-barbara.mp4"
          label="Santa Barbara County Courthouse and downtown"
        />

        <div className={styles.category}>
          <span className={styles.eyebrow}>Restaurants</span>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://los-agaves.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Los Agaves
            </a>{' '}
            — Authentic Mexican, a local institution
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.domstaverna.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dom&rsquo;s Taverna
            </a>{' '}
            — Basque-inspired small plates, great for sharing
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://shorelinebeachcafe.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shoreline Caf&eacute;
            </a>{' '}
            — Breakfast and lunch with tables right on the sand
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://boathousesb.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Boathouse at Hendry&rsquo;s Beach
            </a>{' '}
            — Beachfront seafood, then stroll the sand (say hi to my Dad for
            me — he would&rsquo;ve loved to meet everyone)
          </p>
        </div>

        <div className={styles.category}>
          <span className={styles.eyebrow}>Activities</span>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.santabarbara.com/attractions/santa-barbara-harbor/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Walk the Breakwater
            </a>{' '}
            — Stroll out past the Harbor to Sandspit for the classic SB view
            of mountains meeting sea
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.santabarbara.com/attractions/old-mission-santa-barbara/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Picnic at the Mission Lawn
            </a>{' '}
            — Grounds of the Old Mission, open and free
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.condorexpress.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sunset Cruise
            </a>{' '}
            — Book a cruise from the harbor with the Condor Express
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.funkzone.net/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Wine Tasting in the Funk Zone
            </a>{' '}
            — Walkable district packed with tasting rooms, a few blocks from
            downtown
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://solvangusa.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Day Trip to Solvang
            </a>{' '}
            — Danish village in the Santa Ynez Valley, 35 miles away
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.grassinifamilyvineyards.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Grassini Family Vineyards
            </a>{' '}
            — Family-run tasting room in the Santa Ynez Valley
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.santabarbara.com/activities/beaches/santa-barbara/thousand-steps-beach/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Thousand Steps Beach
            </a>{' '}
            — Locals&rsquo; beach reached by a long stone staircase
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://stearnswharf.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stearns Wharf
            </a>{' '}
            — Historic pier at the foot of State Street
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://liltootsb.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lil&rsquo; Toot
            </a>{' '}
            — Little yellow boat tour around the harbor
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://sbbowl.com/photos/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Santa Barbara Bowl
            </a>{' '}
            — Open-air concert venue with a mountain backdrop
          </p>
        </div>

        <div className={styles.category}>
          <span className={styles.eyebrow}>Hikes</span>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.alltrails.com/trail/us/california/inspiration-point--2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inspiration Point
            </a>{' '}
            — Moderate, 3.5 mi out-and-back, panoramic views of the coastline
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.alltrails.com/trail/us/california/hot-springs-canyon-trail"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hot Springs Trail
            </a>{' '}
            — Moderate, 2.6 mi out-and-back, ends at natural hot springs
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.alltrails.com/trail/us/california/lizards-mouth"
              target="_blank"
              rel="noopener noreferrer"
            >
              Lizard&rsquo;s Mouth
            </a>{' '}
            — Short scramble to a sandstone rock formation with big views
          </p>
          <p className={styles.body}>
            <a
              className={styles.coral}
              href="https://www.alltrails.com/trail/us/california/rattlesnake-canyon--2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rattlesnake Canyon
            </a>{' '}
            — Challenging, 5 mi, creek crossings and canyon scenery
          </p>
        </div>
      </section>
    </article>
  );
}

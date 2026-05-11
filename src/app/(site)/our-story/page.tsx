import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import VideoFrame from '@/src/components/ui/VideoFrame';
import PhotoGallery, { type Photo } from '@/src/components/ui/PhotoGallery';
import { withBase } from '@/src/lib/paths';
import styles from './page.module.css';

/*
 * Our Story — Figma frame 22:1057.
 *   1. Story          — Cormorant heading + body copy + our-story.mp4 +
 *                       a tail of body copy + the Copper-and-Quartz
 *                       Spotify embed for Meghan's track.
 *   2. Photo Gallery  — every photo in public/images/wedding-photos/,
 *                       rendered as a 2-column gallery with a lightbox.
 *
 * The photo manifest is read at build time so each cell's aspect ratio
 * is reserved before the JPEG decodes (no CLS, no flash).
 */
export const metadata = {
  title: 'Our Story · Levi & Meghan',
  description:
    'How Meghan and Levi met, why the wedding is called Copper & Quartz, and a gallery of the road that got us here.',
};

const SPOTIFY_TRACK_ID = '0F654jfCJc6v9FUPaoycNC';

function loadPhotos(): Photo[] {
  const manifestPath = join(
    process.cwd(),
    'public/images/wedding-photos/manifest.json',
  );
  try {
    const raw = readFileSync(manifestPath, 'utf8');
    return JSON.parse(raw) as Photo[];
  } catch {
    return [];
  }
}

export default function OurStoryPage() {
  const photos = loadPhotos();

  return (
    <article className={styles.story}>
      {/* ---------- Section 1: Story ---------- */}
      <section className={styles.section} aria-labelledby="our-story-title">
        <h2 id="our-story-title" className={styles.heading}>
          Copper &amp; Quartz
        </h2>

        <div className={styles.body}>
          <p>
            Meghan and Levi&rsquo;s story started the way a lot of great love
            stories do. Simply, over coffee in 2022. Meghan, a Colorado
            native at heart and a Denver-based educator and singer-songwriter,
            was already deeply rooted in her career and community. Levi had
            just recently traded the fast pace of New York for the mountains,
            moving to Denver in 2021 after spending 20 years in Brooklyn,
            where he studied at Pratt Institute and built his career as a
            designer specializing in digital design.
          </p>
          <p>
            From that first coffee date, it didn&rsquo;t take long to realize
            something special was unfolding. They quickly discovered a shared
            love for the outdoors: camping under the stars, hiking
            Colorado trails, and chasing new adventures together. Just as
            much, they found joy in the quieter moments. Cozy nights at home,
            good conversation, and making each other laugh endlessly.
          </p>
        </div>

        <VideoFrame src="/videos/our-story.mp4" label="Our story" />

        <div className={styles.body}>
          <p>
            In 2023, their little family grew by four paws with the arrival
            of their puppy, Tarone, who quickly became the center of
            their world and the most spoiled (and loved) member of the
            household. On her 2025 album <em>Shadows of a Ghost Town</em>,
            Meghan wrote a song for Levi called <em>Copper and Quartz</em>,
            hence the name of the story and loosely tied to the
            wedding colors as well.
          </p>
          <p>
            What makes Meghan and Levi work so well is how deeply they
            support one another. Levi is Meghan&rsquo;s biggest fan,
            cheering her on in her music career, while Meghan encourages
            Levi&rsquo;s passions, whether that&rsquo;s a day on the
            golf course, time spent dirt biking, or bringing his ever-growing
            woodworking business to life. They show up for each other in big
            ways and small ones, always with love, humor, and a lot of
            laughter.
          </p>
          <p>
            At the heart of it all, their relationship is built on
            partnership, adventure, and the kind of joy that makes even
            ordinary days feel extraordinary. And it all started with a
            simple cup of coffee. ☕
          </p>
        </div>

        <div className={styles.palmBreak} aria-hidden>
          <span className={styles.palmBreakLine} />
          <span className={styles.palmBreakIcon}>
            <img
              src={withBase('/images/svg/palm-break.svg')}
              alt=""
              width={32}
              height={85}
            />
          </span>
          <span className={styles.palmBreakLine} />
        </div>

        <div className={styles.body}>
          <p>
            <span className={styles.label}>
              So why Copper and Quartz you ask?
            </span>{' '}
            Meghan wrote a beautiful song for Levi after a hike they had
            visiting Meghan&rsquo;s family in Arizona. The story goes
            something like &ldquo;whenever you find quartz, copper is
            nearby,&rdquo; or something like that. You can ask
            Stefanie at the wedding for the proper explanation.
          </p>
        </div>

        <div className={styles.spotify}>
          <iframe
            data-testid="embed-iframe"
            title="Copper and Quartz · Meghan's song for Levi"
            src={`https://open.spotify.com/embed/track/${SPOTIFY_TRACK_ID}?utm_source=generator`}
            width="100%"
            height="352"
            frameBorder={0}
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </section>

      {/* ---------- Section 2: Photo Gallery ---------- */}
      <section className={styles.section} aria-labelledby="our-story-gallery">
        <h2 id="our-story-gallery" className={styles.heading}>
          Photo Gallery
        </h2>
        <PhotoGallery photos={photos} />
      </section>
    </article>
  );
}

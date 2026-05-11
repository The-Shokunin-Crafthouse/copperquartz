import Image from 'next/image';
import { withBase } from '@/src/lib/paths';
import PrintButton from './PrintButton';
import styles from './page.module.css';

export default function SaveTheDatePage() {
  return (
    <main className={styles.page} data-scroll-root>
      {/* Page Background ------------------------------------------------- */}
      <Image
        className={styles.palmIllustration}
        src={withBase('/images/palm-illustration@2x.jpg')}
        alt=""
        width={2384}
        height={1454}
        priority
      />

      {/* Coastal scene — anchored to top of horizontal rule */}
      <Image
        className={styles.coastal}
        src={withBase('/images/coastal-scene@2x.png')}
        alt=""
        width={409}
        height={420}
      />

      {/* Courthouse + Print CTA — share an anchor so they move together --- */}
      <div className={styles.courthouseAnchor}>
        <Image
          className={styles.courthouse}
          src={withBase('/images/courthouse-illustration@2x.jpg')}
          alt=""
          width={468}
          height={1727}
        />
        <PrintButton className={styles.printBtn} />
      </div>

      {/* Dividers -------------------------------------------------------- */}
      <div className={styles.dividerV} aria-hidden />
      <div className={styles.dividerH} aria-hidden />

      {/* H1 lockup + Info bar — both scale via cqw within left column --- */}
      <div className={styles.leftColumn}>
        <Image
          className={styles.h1}
          src={withBase('/images/svg/save-the-date.svg')}
          alt="Save the Date"
          width={538}
          height={325}
          priority
        />

        {/* Info bar — Date / Location / Venue */}
        <div className={styles.infoBar}>
          <div className={styles.infoCol}>
            <div className={styles.pillar} aria-hidden />
            <div className={`${styles.infoStack} ${styles.infoStackFixed}`}>
              <p className={styles.infoLabel}>IX.XXIX.MMXXVI</p>
              <p className={styles.infoValue}>Sept. 29th, 2026</p>
            </div>
          </div>
          <div className={styles.infoCol}>
            <div className={styles.pillar} aria-hidden />
            <div className={styles.infoStack}>
              <p className={styles.infoLabel}>LOCATION</p>
              <p className={styles.infoValue}>Santa Barbara, CA</p>
            </div>
          </div>
          <div className={styles.infoCol}>
            <div className={styles.pillar} aria-hidden />
            <div className={`${styles.infoStack} ${styles.infoStackFixed}`}>
              <p className={styles.infoLabel}>VENUE</p>
              <p className={styles.infoValue}>Sunken Garden</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel ---------------------------------------------------- */}
      <div className={styles.rightPanel}>
        <Image
          className={styles.couple}
          src={withBase('/images/svg/levi-meghan.svg')}
          alt="Levi & Meghan"
          width={200}
          height={107}
        />

        <p className={styles.bodyCopy}>
          Request the honor of your presence. An evening under palms, in good
          company, with the ocean near.
        </p>

        <p className={`${styles.rpSectionLabel} ${styles.eventsLabel}`}>
          THE EVENTS OF THE EVENING
        </p>
        <div className={styles.events}>
          <div className={styles.eventRow}>
            <p className={styles.eventNum}>I</p>
            <p className={styles.eventTime}>4:30</p>
            <p className={styles.eventLabel}>Ceremony</p>
          </div>
          <div className={styles.eventRow}>
            <p className={styles.eventNum}>II</p>
            <p className={styles.eventTime}>5:30</p>
            <p className={styles.eventLabel}>Cocktail Hour</p>
          </div>
          <div className={styles.eventRow}>
            <p className={styles.eventNum}>III</p>
            <p className={styles.eventTime}>6:30</p>
            <p className={styles.eventLabel}>Supper</p>
          </div>
          <div className={styles.eventRow}>
            <p className={styles.eventNum}>IV</p>
            <p className={styles.eventTime}>7:00</p>
            <p className={styles.eventLabel}>Dancing</p>
          </div>
        </div>

        <p className={`${styles.rpSectionLabel} ${styles.coordsLabel}`}>
          COORDINATES
        </p>
        <div className={styles.coords}>
          <p className={styles.coordRow}>
            <span className={styles.coordVal}>34.4243° </span>
            <span className={styles.coordDir}>N</span>
          </p>
          <p className={styles.coordRow}>
            <span className={styles.coordVal}>119.7025° </span>
            <span className={styles.coordDir}>W</span>
          </p>
          <p className={styles.coordRow}>
            <span className={styles.coordVal}>75ft </span>
            <span className={styles.coordDir}>E</span>
          </p>
        </div>

        <Image
          className={`${styles.palmIcon} ${styles.palmIconTR}`}
          src={withBase('/images/svg/palm-icon.svg')}
          alt=""
          width={15}
          height={16}
        />
      </div>

      {/* Footer --------------------------------------------------------- */}
      <div className={styles.footer}>
        <div className={styles.footerText}>
          <p className={styles.footerQuote}>
            &ldquo;I have found the one whom my soul loves.&rdquo;
          </p>
          <p className={styles.footerUrl}>copperquartz.family</p>
          <p className={styles.footerNote}>invitation to follow</p>
        </div>

        <Image
          className={styles.badge}
          src={withBase('/images/badge@2x.png')}
          alt=""
          width={244}
          height={244}
        />

        <Image
          className={`${styles.palmIcon} ${styles.palmIconBL}`}
          src={withBase('/images/svg/palm-icon.svg')}
          alt=""
          width={15}
          height={16}
        />
        <Image
          className={`${styles.palmIcon} ${styles.palmIconBR}`}
          src={withBase('/images/svg/palm-icon.svg')}
          alt=""
          width={15}
          height={16}
        />
      </div>
    </main>
  );
}

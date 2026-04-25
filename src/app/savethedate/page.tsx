import styles from './page.module.css';

export default function SaveTheDatePage() {
  return (
    <main className={styles.page}>
      {/* Page Background ------------------------------------------------- */}
      {/* TODO: drop /public/images/palm-illustration@2x.jpg (combined palm + watercolor wash) */}
      <img
        className={styles.palmIllustration}
        src="/images/palm-illustration@2x.jpg"
        alt=""
      />

      {/* Asset: /public/images/coastal-scene@2x.jpg
          (figma layer is "coastal-illustration@2x"; using filename per drop on disk + original spec). */}
      <img
        className={styles.coastal}
        src="/images/coastal-scene@2x.jpg"
        alt=""
      />

      {/* TODO: drop /public/images/courthouse-illustration@2x.jpg */}
      <img
        className={styles.courthouse}
        src="/images/courthouse-illustration@2x.jpg"
        alt=""
      />

      {/* Dividers -------------------------------------------------------- */}
      <div className={styles.dividerV} aria-hidden />
      <div className={styles.dividerH} aria-hidden />

      {/* Print CTA ------------------------------------------------------- */}
      {/* TODO: drop final /public/downloads/save-the-date.pdf before launch */}
      <a
        className={styles.printBtn}
        href="/downloads/save-the-date.pdf"
        download
        aria-label="Download Save the Date PDF"
      >
        Print
      </a>

      {/* H1 lockup ------------------------------------------------------- */}
      {/* TODO: drop /public/images/svg/save-the-date.svg */}
      <img
        className={styles.h1}
        src="/images/svg/save-the-date.svg"
        alt="Save the Date"
      />

      {/* Info bar — Date / Location / Venue ----------------------------- */}
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

      {/* Right panel ---------------------------------------------------- */}
      {/* TODO: drop /public/images/svg/levi-meghan.svg */}
      <img
        className={styles.couple}
        src="/images/svg/levi-meghan.svg"
        alt="Levi & Meghan"
      />

      <p className={styles.bodyCopy}>
        Request the honor of your presence — an evening under palms, in good
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

      {/* TODO: drop /public/images/svg/palm-icon.svg */}
      <img
        className={`${styles.palmIcon} ${styles.palmIconTR}`}
        src="/images/svg/palm-icon.svg"
        alt=""
      />

      {/* Footer --------------------------------------------------------- */}
      <div className={styles.footerText}>
        <p className={styles.footerQuote}>
          &ldquo;I have found the one whom my soul loves.&rdquo;
        </p>
        <p className={styles.footerUrl}>copperquartz.family</p>
        <p className={styles.footerNote}>invitation to follow</p>
      </div>

      {/* TODO: drop /public/images/badge@2x.png (figma group: Seal@2x) */}
      <img
        className={styles.badge}
        src="/images/badge@2x.png"
        alt=""
      />

      <img
        className={`${styles.palmIcon} ${styles.palmIconBL}`}
        src="/images/svg/palm-icon.svg"
        alt=""
      />
      <img
        className={`${styles.palmIcon} ${styles.palmIconBR}`}
        src="/images/svg/palm-icon.svg"
        alt=""
      />
    </main>
  );
}

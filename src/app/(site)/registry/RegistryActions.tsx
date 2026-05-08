'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegistryTile, { type TileCrop } from '@/src/components/ui/RegistryTile';
import HoneymoonModal from './HoneymoonModal';
import KivaModal from './KivaModal';
import HdmgModal from './HdmgModal';
import pageStyles from './page.module.css';
import styles from './RegistryActions.module.css';

const HDMG_DONATE_URL = 'https://www.howlindogmusicgroup.org/support-hdmg';
const SUCCESS_DISMISS_MS = 5000;

/* Crop specs match the existing server page — preserved verbatim so the
   tile composition is identical to ship. The only difference between
   that page and this client wrapper is interactivity wiring on the CTA
   button. */

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

type ModalKey = 'honeymoon' | 'kiva' | 'hdmg' | null;

type Props = {
  /* Server-resolved value of the ?success query param. When true, the
     banner mounts and a router.replace strips the param so a refresh
     doesn't replay the toast. */
  initialSuccess: boolean;
};

export default function RegistryActions({ initialSuccess }: Props) {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [originButton, setOriginButton] = useState<HTMLButtonElement | null>(null);
  const [showBanner, setShowBanner] = useState(initialSuccess);
  const [bannerExiting, setBannerExiting] = useState(false);

  /* Strip ?success=true on hydration so a refresh doesn't replay the
     toast. router.replace keeps the user's scroll position. */
  useEffect(() => {
    if (!initialSuccess) return;
    router.replace('/registry', { scroll: false });
  }, [initialSuccess, router]);

  /* Auto-dismiss the banner after the configured window. The exit
     animation runs first; the banner unmounts after a short tail. */
  useEffect(() => {
    if (!showBanner) return;
    const t = window.setTimeout(() => {
      setBannerExiting(true);
      window.setTimeout(() => setShowBanner(false), 220);
    }, SUCCESS_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [showBanner]);

  function dismissBanner() {
    setBannerExiting(true);
    window.setTimeout(() => setShowBanner(false), 220);
  }

  function openModal(key: Exclude<ModalKey, null>, button: HTMLButtonElement) {
    setOriginButton(button);
    setActiveModal(key);
  }

  function closeModal() {
    setActiveModal(null);
    /* Don't clear originButton — Modal still needs it during its exit
       transition to restore focus. The next openModal overwrites. */
  }

  return (
    <>
      {showBanner ? (
        <div
          className={styles.banner}
          data-state={bannerExiting ? 'closing' : 'open'}
          role="status"
          aria-live="polite"
        >
          <span>We received your gift. Thank you.</span>
          <button
            type="button"
            className={styles.bannerDismiss}
            onClick={dismissBanner}
            aria-label="Dismiss confirmation"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M3 3 L13 13 M13 3 L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      ) : null}

      <div className={pageStyles.sections}>
        <section className={pageStyles.section} aria-labelledby="registry-personal">
          <h3 id="registry-personal" className={pageStyles.eyebrow}>
            Personal
          </h3>
          <div className={pageStyles.tiles}>
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
              onCtaClick={(button) => openModal('honeymoon', button)}
            />
          </div>
        </section>

        <section className={pageStyles.section} aria-labelledby="registry-charities">
          <h3 id="registry-charities" className={pageStyles.eyebrow}>
            Charities
          </h3>
          <div className={pageStyles.tiles}>
            <RegistryTile
              imageSrc="/images/hdmg-desktop.jpg"
              imageSrcMobile="/images/hdmg-mobile.jpg"
              imageAlt="Howlin’ Dog Music Group — vinyl record over a desert horizon at dusk"
              desktopCrop={HDMG_DESKTOP}
              mobileCrop={HDMG_MOBILE}
              overlayCopy="Help artists fund the recording of their next album."
              ctaLabel="Donate"
              ctaAriaLabel="Donate to Howlin’ Dog Music Group"
              onCtaClick={(button) => {
                /* Open the donor's tab first so the click is treated
                   as a user gesture (popup blockers refuse window.open
                   from delayed callbacks). Modal opens immediately
                   after — both happen in the same gesture. */
                window.open(HDMG_DONATE_URL, '_blank', 'noopener,noreferrer');
                openModal('hdmg', button);
              }}
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
              onCtaClick={(button) => openModal('kiva', button)}
            />
          </div>
        </section>
      </div>

      <HoneymoonModal
        open={activeModal === 'honeymoon'}
        onClose={closeModal}
        returnFocusTo={originButton}
      />
      <KivaModal
        open={activeModal === 'kiva'}
        onClose={closeModal}
        returnFocusTo={originButton}
      />
      <HdmgModal
        open={activeModal === 'hdmg'}
        onClose={closeModal}
        returnFocusTo={originButton}
      />
    </>
  );
}

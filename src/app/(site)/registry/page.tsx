import RegistryActions from './RegistryActions';
import styles from './page.module.css';

/*
 * Registry — Sprint 7 wires three checkout modals to the existing tile
 * CTAs (Honeymoon "Gift", HDMG "Donate", Kiva "Donate"). The page shell
 * stays a Server Component so metadata and the section copy continue to
 * render server-side; modal state and the Stripe success-redirect banner
 * live in <RegistryActions />, a Client Component below.
 *
 * The success param is read server-side and threaded down as a prop so
 * the client doesn't have to suspend on useSearchParams — that keeps
 * the tiles in the initial HTML and avoids a hydration flash.
 *
 * Tile composition (crops, alt text, overlay copy) is unchanged from
 * Sprint 6 — RegistryActions re-renders the same RegistryTile spec
 * verbatim so this sprint adds interactivity without touching layout.
 */
export const metadata = {
  title: 'Registry — Levi & Meghan',
  description:
    'If you wish to give beyond your presence — honeymoon contributions, Howlin’ Dog Music Group, and Kiva micro-loans.',
};

type ThankedFund = 'honeymoon' | 'kiva';

type PageProps = {
  searchParams?: Promise<{ success?: string; fund?: string }>;
};

function parseThankedFund(value: string | undefined): ThankedFund | null {
  return value === 'honeymoon' || value === 'kiva' ? value : null;
}

export default async function RegistryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialSuccess = params?.success === 'true';
  const initialFund = initialSuccess ? parseThankedFund(params?.fund) : null;

  return (
    <article className={styles.registry}>
      <h2 className={styles.heading}>Our Registry</h2>

      <p className={styles.intro}>
        While your presence is most important to us, if you wish to give
        further, consider our options below.
      </p>

      <RegistryActions
        initialSuccess={initialSuccess}
        initialFund={initialFund}
      />
    </article>
  );
}

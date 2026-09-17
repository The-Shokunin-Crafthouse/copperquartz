import { rsvpAccessible } from '@/src/lib/rsvpAccess';
import { getConfirmationData } from '@/src/app/actions/getConfirmationData';
import RsvpClient from './RsvpClient';
import Confirmation from './Confirmation';
import RsvpClosed from './RsvpClosed';
import PageHeader from './PageHeader';
import RsvpRouteEffect from './RsvpRouteEffect';
import styles from './rsvp.module.css';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ confirmation?: string }>;

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  /* One boundary for the whole route. Closed means the wizard AND the
     confirmation receipt are both behind it, so there is a single state to
     reason about rather than a half-open surface. */
  if (!(await rsvpAccessible())) {
    return (
      <>
        <RsvpRouteEffect />
        <RsvpClosed />
      </>
    );
  }

  const { confirmation } = await searchParams;

  if (confirmation) {
    const data = await getConfirmationData(confirmation);
    return (
      <>
        <RsvpRouteEffect />
        <Confirmation data={data} />
      </>
    );
  }

  return (
    <>
      <RsvpRouteEffect />
      <section className={styles.page}>
        <PageHeader />
        <RsvpClient />
      </section>
    </>
  );
}

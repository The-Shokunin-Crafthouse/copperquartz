import { getConfirmationData } from '@/src/app/actions/getConfirmationData';
import RsvpClient from './RsvpClient';
import Confirmation from './Confirmation';
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

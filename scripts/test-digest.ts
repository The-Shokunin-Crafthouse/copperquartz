import { sendRsvpDigest } from '../src/app/actions/sendRsvpDigest';

async function main() {
  console.log('[test-digest] calling sendRsvpDigest()…');
  const result = await sendRsvpDigest();
  console.log('[test-digest] result:', result);
}

main().catch((err) => {
  console.error('[test-digest] threw:', err);
  process.exit(1);
});

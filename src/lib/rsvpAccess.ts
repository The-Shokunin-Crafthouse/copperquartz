import 'server-only';

import { cookies } from 'next/headers';
import { RSVP_BYPASS_COOKIE, isBypassKey, rsvpPubliclyOpen } from './rsvpWindow';

/*
 * Request-scoped read of the RSVP window. Split from `rsvpWindow.ts`
 * because `cookies()` is Node/server-component only — middleware cannot
 * import it, and any surface that calls this becomes dynamically
 * rendered. Only the `/rsvp` route (already `force-dynamic`) and the RSVP
 * server actions should reach for it; the site layout uses the sync
 * `rsvpPubliclyOpen()` instead so every other page stays static.
 */

/** True when the bypass cookie on this request carries a valid key. */
export async function hasRsvpBypass(): Promise<boolean> {
  const store = await cookies();
  return isBypassKey(store.get(RSVP_BYPASS_COOKIE)?.value);
}

/**
 * Can THIS request reach the RSVP flow — publicly open, or privately
 * unlocked by the bypass cookie?
 *
 * Every RSVP read and write gates on this, not just the UI. Hiding the
 * button while leaving the server actions live would let a crafted
 * request keep writing after the deadline (studio learning #72).
 */
export async function rsvpAccessible(): Promise<boolean> {
  if (rsvpPubliclyOpen()) return true;
  return hasRsvpBypass();
}

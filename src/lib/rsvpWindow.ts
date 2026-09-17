/*
 * RSVP window — the single source of truth for whether the RSVP flow is
 * reachable. Deliberately runtime-agnostic (no `next/headers`, no
 * `node:crypto`) so middleware on the Edge and server components in Node
 * both import THIS module rather than each carrying its own copy of the
 * rule.
 *
 * Two independent levers, and the distinction matters:
 *
 *   RSVP_ENABLED=1      Publicly open. Nav + footer pills return, /rsvp
 *                       renders the wizard for everyone. This is the
 *                       pre-deadline state. Changing it is a Vercel env
 *                       edit + redeploy — env values are read at build for
 *                       statically-rendered surfaces, so a redeploy is
 *                       required, not optional (studio learning #95).
 *
 *   RSVP_BYPASS_KEY     Privately open, for the couple only. Visiting
 *                       /rsvp/?key=<key> sets a short-lived cookie that
 *                       unlocks the wizard and both server actions for
 *                       that browser alone. No deploy, no env edit, and
 *                       it re-locks itself when the cookie expires.
 *                       /rsvp/?key=off clears it immediately.
 *
 * Default is CLOSED. The flag is positive (`RSVP_ENABLED`, not
 * `DISABLE_RSVP`) so an unset or freshly-provisioned environment fails
 * shut instead of silently reopening the guest list (studio learning #73).
 */

/** Cookie carrying a valid bypass key. httpOnly — set only in middleware. */
export const RSVP_BYPASS_COOKIE = 'cq_rsvp_bypass';

/** Sentinel value on `?key=` that clears the bypass cookie. */
export const RSVP_BYPASS_CLEAR = 'off';

/** Bypass lifetime. Short on purpose: the closed state is the default the
 *  site should drift back toward without anyone remembering to re-hide it. */
export const RSVP_BYPASS_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

/** Refuse to honour a key short enough to be guessable. */
const MIN_KEY_LENGTH = 16;

/*
 * Length-independent compare over the shared prefix. Leaks length only,
 * which for a random 32+ char key is not a usable signal. Hand-rolled
 * because `node:crypto.timingSafeEqual` does not exist on the Edge
 * runtime where middleware evaluates this.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i += 1) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/**
 * Is RSVP open to the public? Env only — no request state — so callers
 * (the site layout, notably) stay statically renderable.
 */
export function rsvpPubliclyOpen(): boolean {
  return process.env.RSVP_ENABLED === '1';
}

/**
 * Does `candidate` match the configured bypass key? False whenever no key
 * is configured, so an unset `RSVP_BYPASS_KEY` cannot be satisfied by an
 * empty or missing query param.
 */
export function isBypassKey(candidate: string | null | undefined): boolean {
  const key = process.env.RSVP_BYPASS_KEY;
  if (!key || key.length < MIN_KEY_LENGTH) return false;
  if (!candidate) return false;
  return constantTimeEqual(candidate, key);
}

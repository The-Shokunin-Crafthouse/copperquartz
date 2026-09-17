/* The admin gate's decision, in one place, so the Edge middleware and the
   Node server actions cannot drift apart.
 *
 * Runtime-agnostic on purpose: no `next/headers`, no `node:` imports, no
 * Buffer. It must import cleanly into Edge middleware, and `atob` is the
 * only base64 decoder available in both runtimes.
 *
 * It returns a decision rather than a Response because the two callers
 * need different shapes: middleware turns it into an HTTP response with a
 * WWW-Authenticate challenge, a server action turns it into a plain error
 * string. */

export type AdminAuthDecision = 'ok' | 'unconfigured' | 'unauthorized';

/* Index signature rather than four optional keys: process.env is typed
   as a bag of unknown keys, and a closed object type has no properties in
   common with it. Reading the four names off a string bag is also what
   makes this callable with a hand-built env in a test. */
type AdminAuthEnv = Record<string, string | undefined>;

export function adminAuthDecision(
  authorizationHeader: string | null,
  env: AdminAuthEnv = process.env,
): AdminAuthDecision {
  /* Local development and the snapshot harness. */
  if (env.SKIP_ADMIN_AUTH === '1') return 'ok';
  /* PR preview deploys, which have no credentials to round-trip. */
  if (env.NEXT_PUBLIC_BASE_PATH) return 'ok';

  const user = env.ADMIN_USER;
  const pass = env.ADMIN_PASS;
  if (!user || !pass) return 'unconfigured';

  if (authorizationHeader?.startsWith('Basic ')) {
    let decoded: string;
    try {
      decoded = atob(authorizationHeader.slice(6));
    } catch {
      /* A malformed base64 payload is a failed credential, not a server
         fault. Decoding it unguarded would turn a bad header into a 500,
         and a server action must never 500 on attacker-chosen input. */
      return 'unauthorized';
    }
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) return 'ok';
    }
  }

  return 'unauthorized';
}

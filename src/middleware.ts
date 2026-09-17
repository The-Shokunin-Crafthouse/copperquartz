import { NextResponse, type NextRequest } from 'next/server';
import { adminAuthDecision } from '@/src/lib/adminAuth';
import {
  RSVP_BYPASS_CLEAR,
  RSVP_BYPASS_COOKIE,
  RSVP_BYPASS_MAX_AGE_SECONDS,
  isBypassKey,
} from '@/src/lib/rsvpWindow';

/*
 * Basic Auth gate for /admin/*. The decision itself lives in
 * src/lib/adminAuth.ts so the admin server actions can re-run exactly the
 * same rules: a server action is a POST endpoint reachable from any
 * route, and this matcher never sees it. Credentials are still read from
 * ADMIN_USER / ADMIN_PASS at request time so they can be rotated without
 * a rebuild.
 *
 * Skipped when SKIP_ADMIN_AUTH=1 OR when the deploy is a PR preview
 * (NEXT_PUBLIC_BASE_PATH set), so snapshot/preview deploys can render
 * the dashboard without a credential round-trip.
 */
function adminAuth(req: NextRequest) {
  const decision = adminAuthDecision(req.headers.get('authorization'));

  if (decision === 'ok') return NextResponse.next();

  if (decision === 'unconfigured') {
    return new NextResponse('Admin credentials are not configured.', {
      status: 503,
    });
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"' },
  });
}

/*
 * RSVP bypass handshake. `?key=<RSVP_BYPASS_KEY>` on /rsvp mints the
 * bypass cookie; `?key=off` clears it. Both then redirect to the clean
 * canonical URL so the key never lingers in the address bar, in history,
 * or in a screenshot taken for the portfolio.
 *
 * Cookie minting has to happen here rather than in the page: a server
 * component render cannot set cookies. Middleware is also the only place
 * that sees the query string before the page decides what to render.
 *
 * A wrong key is treated exactly like no key — redirected, no cookie, no
 * distinguishing response — so the endpoint cannot be used as an oracle.
 */
function rsvpBypass(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key === null) return NextResponse.next();

  const clean = req.nextUrl.clone();
  clean.searchParams.delete('key');
  const res = NextResponse.redirect(clean);

  if (key === RSVP_BYPASS_CLEAR) {
    res.cookies.delete(RSVP_BYPASS_COOKIE);
    return res;
  }

  if (isBypassKey(key)) {
    res.cookies.set(RSVP_BYPASS_COOKIE, key, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
      path: '/',
      maxAge: RSVP_BYPASS_MAX_AGE_SECONDS,
    });
  }

  return res;
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) return adminAuth(req);
  return rsvpBypass(req);
}

/* `trailingSlash: true` makes /rsvp/ canonical, but a hand-typed or
   printed /rsvp must match too — hence both entries. */
export const config = {
  matcher: ['/admin/:path*', '/rsvp', '/rsvp/'],
};

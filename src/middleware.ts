import { NextResponse, type NextRequest } from 'next/server';
import {
  RSVP_BYPASS_CLEAR,
  RSVP_BYPASS_COOKIE,
  RSVP_BYPASS_MAX_AGE_SECONDS,
  isBypassKey,
} from '@/src/lib/rsvpWindow';

/*
 * Basic Auth gate for /admin/*. Credentials read from ADMIN_USER /
 * ADMIN_PASS at request time so they can be rotated without rebuild.
 *
 * Skipped when SKIP_ADMIN_AUTH=1 OR when the deploy is a PR preview
 * (NEXT_PUBLIC_BASE_PATH set), so snapshot/preview deploys can render
 * the dashboard without a credential round-trip.
 */
function adminAuth(req: NextRequest) {
  if (process.env.SKIP_ADMIN_AUTH === '1') return NextResponse.next();
  if (process.env.NEXT_PUBLIC_BASE_PATH) return NextResponse.next();

  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) {
    return new NextResponse('Admin credentials are not configured.', {
      status: 503,
    });
  }

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(':');
    if (sep !== -1) {
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (u === user && p === pass) return NextResponse.next();
    }
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

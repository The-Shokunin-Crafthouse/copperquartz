import { NextResponse, type NextRequest } from 'next/server';

/*
 * Basic Auth gate for /admin/*. Credentials read from ADMIN_USER /
 * ADMIN_PASS at request time so they can be rotated without rebuild.
 *
 * Skipped when SKIP_ADMIN_AUTH=1 OR when the deploy is a PR preview
 * (NEXT_PUBLIC_BASE_PATH set), so snapshot/preview deploys can render
 * the dashboard without a credential round-trip.
 */
export function middleware(req: NextRequest) {
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

export const config = {
  matcher: ['/admin/:path*'],
};

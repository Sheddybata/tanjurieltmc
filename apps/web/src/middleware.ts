import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  DOMAINS,
  isAdminHost,
  isLocalHost,
  isPublicHost,
  isPublicMarketingRoute,
  isStaffRoute,
  normalizeHost,
} from '@/lib/domains';

export function middleware(request: NextRequest) {
  const host = normalizeHost(
    request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
  );
  const { pathname } = request.nextUrl;

  if (isLocalHost(host)) {
    return NextResponse.next();
  }

  if (isAdminHost(host)) {
    if (pathname === '/' || pathname === '/index.html') {
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }

    if (isPublicMarketingRoute(pathname)) {
      return NextResponse.redirect(new URL(pathname, DOMAINS.publicSite));
    }

    return NextResponse.next();
  }

  if (isPublicHost(host) && isStaffRoute(pathname)) {
    return NextResponse.redirect(new URL(pathname, DOMAINS.adminSite));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|downloads/).*)'],
};

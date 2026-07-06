import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  DOMAINS,
  isAdminHost,
  isLocalHost,
  isPublicHost,
  isPublicMarketingRoute,
  isStaffRoute,
} from '@/lib/domains';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const { pathname } = request.nextUrl;

  if (isLocalHost(host)) {
    return NextResponse.next();
  }

  if (isAdminHost(host)) {
    if (pathname === '/') {
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

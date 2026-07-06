const publicHost = process.env.NEXT_PUBLIC_PUBLIC_HOST ?? 'tanjurieltmc.com';
const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOST ?? 'admin.tanjurieltmc.com';

export const DOMAINS = {
  publicHost,
  adminHost,
  publicSite: process.env.NEXT_PUBLIC_SITE_URL ?? `https://${publicHost}`,
  adminSite: process.env.NEXT_PUBLIC_ADMIN_URL ?? `https://${adminHost}`,
};

const STAFF_ROUTE_PREFIXES = ['/dashboard', '/teller', '/manager', '/admin', '/reports', '/staff', '/login'];

const PUBLIC_ROUTE_PREFIXES = [
  '/about',
  '/personal',
  '/business',
  '/app',
  '/support',
  '/contact',
];

export function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1';
}

export function isAdminHost(host: string): boolean {
  return host === adminHost || host === `www.${adminHost}`;
}

export function isPublicHost(host: string): boolean {
  return host === publicHost || host === `www.${publicHost}`;
}

export function isStaffRoute(pathname: string): boolean {
  return STAFF_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isPublicMarketingRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Staff login path on the current host (localhost keeps everything on one origin). */
export function staffLoginPath(host?: string): string {
  if (!host || isLocalHost(host)) return '/staff/login';
  if (isAdminHost(host)) return '/staff/login';
  return `${DOMAINS.adminSite}/staff/login`;
}

/** Public homepage URL (for links from the admin subdomain). */
export function publicSiteUrl(path = '/'): string {
  if (process.env.NODE_ENV === 'development') {
    return path;
  }
  return `${DOMAINS.publicSite}${path === '/' ? '' : path}`;
}

export function staffPortalUrl(path = '/staff/login'): string {
  if (process.env.NODE_ENV === 'development') {
    return path;
  }
  return `${DOMAINS.adminSite}${path}`;
}

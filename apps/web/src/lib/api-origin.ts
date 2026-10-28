const DEFAULT_PROD_API = 'https://api.tanjurieltmc.com';

function normalizeOrigin(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

/** Base URL for static assets (uploads) and Supabase media URLs */
export function apiOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  if (explicit) return normalizeOrigin(explicit);

  let base = normalizeOrigin(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

  if (typeof window !== 'undefined' && base.includes('localhost')) {
    const host = window.location.hostname;
    if (host.includes('tanjurieltmc.com') || host.endsWith('.vercel.app')) {
      base = DEFAULT_PROD_API;
    }
  }

  return base;
}

function isAdminProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host.includes('tanjurieltmc.com') || host.endsWith('.vercel.app');
}

export function apiAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Same-origin proxy (/uploads → API) on production admin
  if (normalized.startsWith('/uploads/') && isAdminProductionHost()) {
    return normalized;
  }

  return `${apiOrigin()}${normalized}`;
}

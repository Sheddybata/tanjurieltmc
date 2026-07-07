const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Base URL for static assets (uploads) served outside /api/v1 */
export function apiOrigin(): string {
  return API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

export function apiAssetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${apiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Prisma opens a pool per client. Supabase session pooler (port 5432 on pooler host)
 * caps concurrent sessions (~15). Force a low limit unless the URL already sets one.
 */
export function resolvePrismaDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl?.trim()) {
    return rawUrl;
  }

  let url = rawUrl.trim();
  if (/connection_limit=/i.test(url)) {
    return url;
  }

  const isPooler =
    /pooler\.supabase\.com/i.test(url) ||
    /:6543[/?]/i.test(url) ||
    /pgbouncer=true/i.test(url);

  if (!isPooler) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  if (/pgbouncer=true/i.test(url) || /:6543[/?]/i.test(url)) {
    return `${url}${separator}connection_limit=1`;
  }

  // Session-mode pooler (often :5432 on pooler host)
  return `${url}${separator}connection_limit=1`;
}

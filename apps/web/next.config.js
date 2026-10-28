/** @type {import('next').NextConfig} */

function apiOriginForRewrites() {
  const raw =
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.VERCEL === '1' ? 'https://api.tanjurieltmc.com' : 'http://localhost:4000');
  return raw.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}

const nextConfig = {
  transpilePackages: ['@tanjuriel/shared'],
  async rewrites() {
    const apiOrigin = apiOriginForRewrites();
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  // Stripe POSTs to /api/webhooks/stripe without slash; trailingSlash
  // would 308-redirect and break signature verification. This flag keeps
  // canonical URLs slashed but stops the auto-redirect.
  skipTrailingSlashRedirect: true,
  basePath,
  assetPrefix: basePath || undefined,
};

module.exports = nextConfig;

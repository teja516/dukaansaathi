const isProd = process.env.NODE_ENV === 'production';

// Security headers (spec 18.4). Framing is only blocked in production: the development preview
// runs inside an embedding pane and needs to be framed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? '' : ' ws: wss:'}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["frame-ancestors 'none'"] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev only: by default Next keeps ~5 compiled pages and drops idle ones after ~25s, which throws away
  // the work of the start-up warm-up and makes pages slow again. Keep all of them for the whole session.
  onDemandEntries: { maxInactiveAge: 24 * 60 * 60 * 1000, pagesBufferLength: 200 },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default { ...nextConfig, ...(process.env.NEXEN_DIST_DIR ? { distDir: process.env.NEXEN_DIST_DIR } : {}) };

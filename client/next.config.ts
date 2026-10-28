// The browser only ever talks to this Next.js origin. Requests to /api/* are
// proxied to the Express API, so the session cookie stays first-party
// (httpOnly + SameSite=Lax) and no CORS is needed in the browser.
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const API_URL = process.env.API_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The client is a self-contained app; don't let the repo-root lockfile
  // (used only for the `npm run dev` helper) be picked as the workspace root.
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // The service worker must never be served stale.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;

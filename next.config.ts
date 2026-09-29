import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' 'unsafe-inline' blob: https://cdn.jsdelivr.net https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://*.protect.clerk.com;
  worker-src 'self' blob: https://cdn.jsdelivr.net https://challenges.cloudflare.com;
  child-src 'self' blob: https://challenges.cloudflare.com https://*.protect.clerk.com https://*.clerk.accounts.dev https://*.clerk.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https: https://*.clerk.accounts.dev https://*.clerk.com https://img.clerk.com https://images.clerk.dev https://*.youtube.com https://i.ytimg.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' ws: wss: ws://127.0.0.1:7880 wss://127.0.0.1:7880 http://127.0.0.1:7880 https://cdn.jsdelivr.net https://storage.googleapis.com https://*.clerk.accounts.dev https://*.clerk.com https://*.protect.clerk.com:* https://clerk-telemetry.com https://challenges.cloudflare.com https://*.backblazeb2.com https://*.r2.cloudflarestorage.com https://*.amazonaws.com;
  media-src 'self' blob: data: https:;
  frame-src 'self' blob: data: https://*.backblazeb2.com https://*.r2.cloudflarestorage.com https://*.amazonaws.com https://www.youtube.com https://*.youtube.com https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://*.protect.clerk.com;
  frame-ancestors 'self';
  object-src 'self' blob: data:;
  base-uri 'self';
  form-action 'self' https://*.clerk.accounts.dev https://*.clerk.com;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/backgrounds/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), display-capture=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

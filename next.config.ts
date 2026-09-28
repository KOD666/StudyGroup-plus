import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://*.clerk.accounts.dev https://*.clerk.com https://img.clerk.com https://images.clerk.dev https://*.youtube.com https://i.ytimg.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' ws: wss: ws://127.0.0.1:7880 wss://127.0.0.1:7880 http://127.0.0.1:7880 https://*.clerk.accounts.dev https://*.clerk.com https://*.backblazeb2.com https://*.r2.cloudflarestorage.com https://*.amazonaws.com;
  media-src 'self' blob: data: https:;
  frame-src 'self' https://www.youtube.com https://*.youtube.com https://*.clerk.accounts.dev;
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
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
            value: "DENY",
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

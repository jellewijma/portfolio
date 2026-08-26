import { fileURLToPath } from "node:url";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

const root = fileURLToPath(new URL(".", import.meta.url));

/** @type {import("next").NextConfig} */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.convex.site https://api.resend.com https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    globalNotFound: true,
  },
  turbopack: {
    root,
  },
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/gallery.html",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/admin.html",
        destination: "/admin",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withMicrofrontends(nextConfig);

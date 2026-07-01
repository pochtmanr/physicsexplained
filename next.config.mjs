import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Content-Security-Policy. Shipped Report-Only first so we can observe
// violations on KaTeX / jsxgraph / Turnstile / Supabase / Vercel Analytics
// before promoting to an enforcing `Content-Security-Policy` header.
const csp = [
  "default-src 'self'",
  // Next.js inlines a small runtime script; unsafe-eval is needed in dev.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://vitals.vercel-insights.com https://*.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/harmonic-motion",
        destination: "/classical-mechanics/the-simple-pendulum",
        permanent: true,
      },
      {
        source: "/kepler",
        destination: "/classical-mechanics/kepler",
        permanent: true,
      },
      {
        source: "/:locale/classical-mechanics/pendulum",
        destination: "/:locale/classical-mechanics/the-simple-pendulum",
        permanent: true,
      },
      {
        source: "/classical-mechanics/pendulum",
        destination: "/classical-mechanics/the-simple-pendulum",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
  },
});

export default withNextIntl(withMDX(nextConfig));

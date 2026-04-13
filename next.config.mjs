import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["ts", "tsx", "mdx"],
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

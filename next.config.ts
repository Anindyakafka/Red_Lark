import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  turbopack: { root: process.cwd() },
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_ANALYTICS_DOMAIN:
      process.env.ANALYTICS_DOMAIN?.trim() ||
      process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN?.trim() ||
      "",
  },
};
export default config;

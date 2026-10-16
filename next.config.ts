import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  poweredByHeader: false,
  experimental: { globalNotFound: true },
  turbopack: { root: process.cwd() },
  images: { unoptimized: true },
};
export default config;

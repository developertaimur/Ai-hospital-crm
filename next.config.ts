import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind is handled via postcss.config.mjs (@tailwindcss/postcss).
  // Dev defaults to Webpack (`npm run dev`) because Turbopack can panic on
  // stale task caches on this Windows setup. Optional: `npm run dev:turbo`.
};

export default nextConfig;

import type { NextConfig } from "next";
import assets from "./src/data/assets.json";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: true,
  devIndicators: false,
  async redirects() {
    const legacyImages = Object.entries(assets).map(
      ([source, destination]) => ({
        source: new URL(source).pathname.replace(/[():*+?{}]/g, "\\$&"),
        destination,
        permanent: true,
      }),
    );
    return [
      ...[
        "/sitemap_index.xml",
        "/wp-sitemap.xml",
        "/page-sitemap.xml",
        "/post-sitemap.xml",
      ].map((source) => ({
        source,
        destination: "/sitemap.xml",
        permanent: true,
      })),
      ...legacyImages,
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

import path from "node:path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-to-img and pdfjs-dist (used directly for text extraction) resolve
  // pdfjs-dist's worker script, standard fonts, and cmaps from node_modules
  // at runtime — bundling either rewrites those paths and breaks at runtime.
  // Leave both as plain requires instead of letting webpack/turbopack touch
  // them.
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist"],
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);

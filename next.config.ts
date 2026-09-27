import path from "node:path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // pdf-parse (via pdfjs-dist) loads a worker script from a path that only
  // exists in node_modules — bundling it rewrites that path and breaks at
  // runtime. Leave it as a plain require instead of letting webpack/turbopack
  // touch it.
  serverExternalPackages: ["pdf-parse"],
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

export default withSerwist(nextConfig);

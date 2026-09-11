import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native/WASM image codecs: load from node_modules at runtime rather than
  // bundling them. sharp ships platform binaries, heic-convert a ~2 MB WASM.
  serverExternalPackages: ["sharp", "heic-convert", "libheif-js"],

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.CORS_ORIGIN ?? "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;

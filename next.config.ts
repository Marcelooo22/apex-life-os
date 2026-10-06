import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * PWA con Serwist: genera `public/sw.js` en cada build y precachea la app
 * completa (HTML + JS + CSS + iconos + manifest) para que abra al instante y
 * funcione sin conexión, igual que el service worker original.
 */
const buildRevision = randomUUID();

// Los iconos de /public/icons se precachean con una revisión basada en su contenido.
const iconsDir = join(process.cwd(), "public", "icons");
const iconEntries = readdirSync(iconsDir)
  .filter((file) => file.endsWith(".png"))
  .map((file) => ({
    url: `/icons/${file}`,
    revision: createHash("md5").update(readFileSync(join(iconsDir, file))).digest("hex"),
  }));

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [
    { url: "/", revision: buildRevision },
    { url: "/manifest.webmanifest", revision: buildRevision },
    ...iconEntries,
  ],
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // El service worker nunca debe quedarse en caché del navegador.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);

import type { MetadataRoute } from "next";

const icon = (src: string, sizes: string, purpose?: "any" | "maskable") => ({
  src,
  sizes,
  type: "image/png",
  ...(purpose ? { purpose } : {}),
});

/** Equivale al manifest.webmanifest original. Next lo sirve en /manifest.webmanifest. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Apex",
    short_name: "Apex",
    description: "Tu sistema personal: gym, hábitos, nutrición y universidad.",
    lang: "es",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["health", "productivity", "lifestyle"],
    icons: [
      icon("/icons/icon-192.png", "192x192", "any"),
      icon("/icons/icon-512.png", "512x512", "any"),
      icon("/icons/icon-maskable-512.png", "512x512", "maskable"),
    ],
    shortcuts: [
      { name: "Gym", url: "/#gym", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Hábitos", url: "/#habits", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Nutrición", url: "/#nutrition", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Universidad", url: "/#uni", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

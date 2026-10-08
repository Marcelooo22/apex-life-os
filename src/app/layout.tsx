import SplashScreen from "@/components/SplashScreen";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex",
  description: "Apex: tu sistema personal para gym, hábitos, nutrición, hobbies y universidad.",
  applicationName: "Apex",
  // El manifest lo genera src/app/manifest.ts (Next añade el <link rel="manifest"> solo).
  icons: {
    icon: [{ url: "/icons/icon-192.png", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Apex", statusBarStyle: "black-translucent" },
  other: { "mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SplashScreen />
        {children}
        <noscript>
          <p style={{ padding: 24, color: "#fff" }}>Apex necesita JavaScript activado.</p>
        </noscript>
      </body>
    </html>
  );
}

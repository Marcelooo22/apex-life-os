import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Créditos y licencias · Apex",
  description: "Datos, imágenes y programas de terceros que usa Apex.",
};

const CREDITS = [
  {
    name: "GetSongBPM.com",
    href: "https://getsongbpm.com",
    text: "El BPM (tempo) y la tonalidad de las canciones provienen de la base de datos de GetSongBPM.",
  },
  { name: "Open Food Facts", href: "https://world.openfoodfacts.org", text: "Información nutricional de alimentos. Datos bajo licencia abierta ODbL, aportados por la comunidad." },
  { name: "Deezer", href: "https://www.deezer.com", text: "Búsqueda de canciones y carátulas de álbum." },
  { name: "Spotify", href: "https://open.spotify.com", text: "Búsqueda de canciones (opcional) y enlaces para escuchar." },
  { name: "react-body-highlighter", href: "https://github.com/HichamELBSI/react-native-body-highlighter", text: "Dibujos anatómicos de los músculos, con licencia MIT (© 2022 ELABBASSI Hicham)." },
  { name: "three.js", href: "https://threejs.org", text: "Motor 3D del maniquí que muestra cómo hacer cada ejercicio. Licencia MIT." },
  { name: "Newsreader", href: "https://github.com/productiontype/Newsreader", text: "Tipografía de la sección Universidad. Licencia SIL Open Font License." },
] as const;

export default function Creditos() {
  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 20px 80px", lineHeight: 1.55, color: "#f2f2f4", background: "#000", minHeight: "100dvh", fontFamily: "system-ui, sans-serif" }}>
      <p>
        <Link href="/" style={{ color: "#9fb4ff" }}>
          ← Volver a Apex
        </Link>
      </p>
      <h1 style={{ fontSize: 30, margin: "18px 0 8px" }}>Créditos y licencias</h1>
      <p style={{ color: "#a1a1aa" }}>Apex se apoya en datos y programas de otras personas y proyectos. Gracias a todos ellos.</p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: 24, display: "grid", gap: 18 }}>
        {CREDITS.map((c) => (
          <li key={c.name}>
            <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ color: "#9fb4ff", fontWeight: 700, fontSize: 18 }}>
              {c.name}
            </a>
            <div style={{ color: "#c9c9d1" }}>{c.text}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}

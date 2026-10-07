import type { ReactNode } from "react";
import type { Zone } from "@/lib/exercises";
import type { Sex } from "@/lib/types";

interface Props {
  sex?: Sex;
  /** Color de relleno por zona (las que falten quedan neutras). */
  fills?: Partial<Record<Zone, string>>;
  /** Texto accesible/tooltip por zona. */
  titles?: Partial<Record<Zone, string>>;
  label: string;
}

const NEUTRAL = "rgba(255,255,255,.07)";

/** Mitad izquierda de cada zona simétrica (la derecha se obtiene reflejando). */
const FRONT_HALF: Partial<Record<Zone, ReactNode>> = {
  hombros: <ellipse cx="57" cy="77" rx="13" ry="14" />,
  pecho: <path d="M72 82 Q85 76 99 85 L99 109 Q85 116 72 105 Z" />,
  biceps: <ellipse cx="45" cy="106" rx="8" ry="17" transform="rotate(8 45 106)" />,
  antebrazos: <ellipse cx="39" cy="147" rx="7" ry="21" transform="rotate(5 39 147)" />,
  oblicuos: <ellipse cx="69" cy="137" rx="6" ry="22" />,
  cuadriceps: <path d="M70 188 L99 188 L99 238 Q98 262 91 272 L76 272 Q68 252 66 228 Z" />,
  gemelos: <ellipse cx="83" cy="316" rx="10" ry="34" />,
};
const BACK_HALF: Partial<Record<Zone, ReactNode>> = {
  hombros: <ellipse cx="57" cy="77" rx="13" ry="14" />,
  dorsales: <path d="M72 90 L96 104 L98 152 L80 152 Q69 132 70 104 Z" />,
  triceps: <ellipse cx="45" cy="106" rx="8" ry="18" transform="rotate(8 45 106)" />,
  antebrazos: <ellipse cx="39" cy="147" rx="7" ry="21" transform="rotate(5 39 147)" />,
  gluteos: <path d="M68 172 Q70 160 99 164 L99 204 Q80 212 68 196 Z" />,
  isquios: <path d="M68 208 L99 208 L99 250 Q98 266 91 274 L76 274 Q67 254 66 232 Z" />,
  gemelos: <ellipse cx="83" cy="316" rx="11" ry="33" />,
};
const FRONT_CENTER: Partial<Record<Zone, ReactNode>> = {
  abdomen: (
    <>
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x="88" y={112 + r * 14} width="11" height="11" rx="4" />
          <rect x="101" y={112 + r * 14} width="11" height="11" rx="4" />
        </g>
      ))}
    </>
  ),
};
const BACK_CENTER: Partial<Record<Zone, ReactNode>> = {
  trapecio: <path d="M100 58 L122 70 L114 100 L100 114 L86 100 L78 70 Z" />,
  lumbar: <rect x="88" y="150" width="24" height="26" rx="8" />,
};

const SILHOUETTE_MALE = "M64 66 Q100 54 136 66 L146 98 L140 160 Q138 176 132 184 L68 184 Q62 176 60 160 L54 98 Z";
const SILHOUETTE_FEMALE = "M68 66 Q100 56 132 66 L140 98 L133 142 Q130 162 140 184 L60 184 Q70 162 67 142 L60 98 Z";
const ARM = "M64 70 Q44 74 40 100 L33 150 Q31 170 38 178 L49 178 Q55 168 55 150 L63 112 Z";
const LEG = "M69 184 L100 184 L99 252 L95 340 Q94 360 84 362 L73 362 Q69 354 71 338 L66 252 Z";

function Figure({ sex, half, center, fills, titles }: { sex: Sex | undefined; half: Partial<Record<Zone, ReactNode>>; center: Partial<Record<Zone, ReactNode>>; fills: Props["fills"]; titles: Props["titles"] }) {
  const zone = (z: Zone, node: ReactNode, key: string) => (
    <g key={key} className="bm-z" fill={fills?.[z] ?? NEUTRAL} data-zone={z}>
      {titles?.[z] && <title>{titles[z]}</title>}
      {node}
    </g>
  );
  const halves = (mirror: boolean) =>
    Object.entries(half).map(([z, node]) => zone(z as Zone, node, `${z}${mirror ? "r" : "l"}`));
  return (
    <g transform={sex === "female" ? "translate(100 0) scale(.95 1) translate(-100 0)" : undefined}>
      <g className="bm-base">
        <circle cx="100" cy="30" r="18" />
        <rect x="92" y="46" width="16" height="16" rx="6" />
        <path d={sex === "female" ? SILHOUETTE_FEMALE : SILHOUETTE_MALE} />
        <path d={ARM} />
        <path d={LEG} />
        <g transform="translate(200 0) scale(-1 1)">
          <path d={ARM} />
          <path d={LEG} />
        </g>
      </g>
      {halves(false)}
      <g transform="translate(200 0) scale(-1 1)">{halves(true)}</g>
      {Object.entries(center).map(([z, node]) => zone(z as Zone, node, z))}
    </g>
  );
}

/** Cuerpo de frente y de espalda con las zonas coloreadas. */
export function BodyMap({ sex, fills, titles, label }: Props) {
  return (
    <svg className="bm" viewBox="0 0 420 372" role="img" aria-label={label}>
      <g>
        <Figure sex={sex} half={FRONT_HALF} center={FRONT_CENTER} fills={fills} titles={titles} />
      </g>
      <g transform="translate(220 0)">
        <Figure sex={sex} half={BACK_HALF} center={BACK_CENTER} fills={fills} titles={titles} />
      </g>
      <text x="100" y="370" className="bm-t" textAnchor="middle">Frente</text>
      <text x="320" y="370" className="bm-t" textAnchor="middle">Espalda</text>
    </svg>
  );
}

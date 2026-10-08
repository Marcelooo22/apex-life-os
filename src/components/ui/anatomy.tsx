import { useRef, useState, type PointerEvent } from "react";
import { ANATOMY, ANATOMY_VIEWBOX, type AnatomyPart } from "@/lib/anatomy-data";
import type { Zone } from "@/lib/exercises";
import type { Sex } from "@/lib/types";

/** Nombre del dibujo anatómico → zona de Apex. */
const SLUG_ZONE: Record<string, Zone> = {
  chest: "pecho", deltoids: "hombros", biceps: "biceps", triceps: "triceps", forearm: "antebrazos", abs: "abdomen", obliques: "oblicuos",
  "upper-back": "dorsales", trapezius: "trapecio", "lower-back": "lumbar", gluteal: "gluteos", quadriceps: "cuadriceps", hamstring: "isquios", calves: "gemelos",
};

const SLUG_NAME: Record<string, string> = {
  chest: "Pecho", deltoids: "Hombros", biceps: "Bíceps", triceps: "Tríceps", forearm: "Antebrazos", abs: "Abdomen", obliques: "Oblicuos",
  "upper-back": "Dorsales y espalda alta", trapezius: "Trapecio", "lower-back": "Zona lumbar", gluteal: "Glúteos", quadriceps: "Cuádriceps",
  hamstring: "Isquiotibiales", calves: "Gemelos", tibialis: "Tibial anterior", adductors: "Aductores", neck: "Cuello", hands: "Manos",
  feet: "Pies", knees: "Rodillas", ankles: "Tobillos", head: "Cabeza", hair: "Cabeza",
};

const MUSCLE = "#5c6f93";
const SOFT = "#252f3f";
const NEUTRAL: Record<string, string> = { head: "#2e3949", hair: "#171c26", hands: SOFT, feet: SOFT, ankles: SOFT, knees: SOFT, neck: SOFT, adductors: "#44536e", tibialis: "#44536e" };

interface Props {
  sex?: Sex;
  /** Color de cada zona (las que falten quedan en azul grisáceo). */
  fills?: Partial<Record<Zone, string>>;
  titles?: Partial<Record<Zone, string>>;
  label: string;
}

function Side({ sex, side, fills }: { sex: "male" | "female"; side: "front" | "back"; fills: Props["fills"] }) {
  const view = ANATOMY[sex][side];
  const render = (part: AnatomyPart) => {
    const zone = SLUG_ZONE[part.slug];
    const fill = (zone && fills?.[zone]) || NEUTRAL[part.slug] || MUSCLE;
    const paths = [...(part.common ?? []), ...(part.left ?? []), ...(part.right ?? [])];
    return (
      <g key={part.slug} fill={fill} data-slug={part.slug} data-zone={zone} style={zone && fills?.[zone] ? { filter: `drop-shadow(0 0 5px ${fill})` } : undefined}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    );
  };
  return (
    <svg viewBox={ANATOMY_VIEWBOX[sex][side]} aria-hidden="true">
      <path d={view.outline} fill="#0b0f15" stroke="#3a4559" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {view.parts.map(render)}
    </svg>
  );
}

/** Cuerpo humano con los músculos dibujados, de frente y de espalda. Al pasar el cursor (o tocar) un músculo se muestra su nombre. */
export function Anatomy({ sex, fills, titles, label }: Props) {
  const gender = sex === "female" ? "female" : "male";
  const box = useRef<HTMLElement>(null);
  const hide = useRef<number | undefined>(undefined);
  const [tip, setTip] = useState<{ x: number; y: number; name: string; detail?: string } | null>(null);

  const show = (e: PointerEvent<HTMLElement>) => {
    const g = (e.target as Element).closest?.("g[data-slug]") as SVGGElement | null;
    const rect = box.current?.getBoundingClientRect();
    if (!g || !rect) return setTip(null);
    const slug = g.dataset.slug ?? "";
    const zone = SLUG_ZONE[slug];
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, name: SLUG_NAME[slug] ?? slug, detail: zone ? titles?.[zone] : undefined });
    if (e.pointerType !== "mouse") {
      window.clearTimeout(hide.current);
      hide.current = window.setTimeout(() => setTip(null), 2400);
    }
  };

  return (
    <figure className="anat" ref={box} role="img" aria-label={label} onPointerMove={show} onPointerDown={show} onPointerLeave={() => setTip(null)}>
      <div className="anat-v">
        <Side sex={gender} side="front" fills={fills} />
        <span>Frente</span>
      </div>
      <div className="anat-v">
        <Side sex={gender} side="back" fills={fills} />
        <span>Espalda</span>
      </div>
      {tip && (
        <div className="anat-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <b>{tip.name}</b>
          {tip.detail && <small>{tip.detail}</small>}
        </div>
      )}
    </figure>
  );
}

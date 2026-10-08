import { ANATOMY, ANATOMY_VIEWBOX, type AnatomyPart } from "@/lib/anatomy-data";
import type { Zone } from "@/lib/exercises";
import type { Sex } from "@/lib/types";

/** Nombre del dibujo anatómico → zona de Apex. */
const SLUG_ZONE: Record<string, Zone> = {
  chest: "pecho", deltoids: "hombros", biceps: "biceps", triceps: "triceps", forearm: "antebrazos", abs: "abdomen", obliques: "oblicuos",
  "upper-back": "dorsales", trapezius: "trapecio", "lower-back": "lumbar", gluteal: "gluteos", quadriceps: "cuadriceps", hamstring: "isquios", calves: "gemelos",
};

const MUSCLE = "#8296b0";
const SOFT = "#d3dae5";
const NEUTRAL: Record<string, string> = { head: "#dfe4ec", hair: "#8d97a8", hands: SOFT, feet: SOFT, ankles: SOFT, knees: SOFT, neck: SOFT, adductors: "#a8b6c9", tibialis: "#a8b6c9" };

interface Props {
  sex?: Sex;
  /** Color de cada zona (las que falten quedan en azul grisáceo). */
  fills?: Partial<Record<Zone, string>>;
  titles?: Partial<Record<Zone, string>>;
  label: string;
}

function Side({ sex, side, fills, titles }: { sex: "male" | "female"; side: "front" | "back"; fills: Props["fills"]; titles: Props["titles"] }) {
  const view = ANATOMY[sex][side];
  const render = (part: AnatomyPart) => {
    const zone = SLUG_ZONE[part.slug];
    const fill = (zone && fills?.[zone]) || NEUTRAL[part.slug] || MUSCLE;
    const paths = [...(part.common ?? []), ...(part.left ?? []), ...(part.right ?? [])];
    return (
      <g key={part.slug} fill={fill} data-zone={zone}>
        {zone && titles?.[zone] && <title>{titles[zone]}</title>}
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    );
  };
  return (
    <svg viewBox={ANATOMY_VIEWBOX[sex][side]} aria-hidden="true">
      <path d={view.outline} fill="#fff" stroke="#b3bdcc" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {view.parts.map(render)}
    </svg>
  );
}

/** Cuerpo humano con los músculos dibujados, de frente y de espalda, sobre fondo claro. */
export function Anatomy({ sex, fills, titles, label }: Props) {
  const gender = sex === "female" ? "female" : "male";
  return (
    <figure className="anat" role="img" aria-label={label}>
      <div className="anat-v">
        <Side sex={gender} side="front" fills={fills} titles={titles} />
        <span>Frente</span>
      </div>
      <div className="anat-v">
        <Side sex={gender} side="back" fills={fills} titles={titles} />
        <span>Espalda</span>
      </div>
    </figure>
  );
}

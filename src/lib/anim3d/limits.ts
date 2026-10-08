import type { Pose } from "./types";

/** Rango de movimiento anatómico de cada articulación (grados). Fuera de esto, el cuerpo humano no llega. */
export const ROM: Partial<Record<keyof Pose, [number, number]>> = {
  hinge: [-35, 95],
  twist: [-60, 60],
  neck: [-40, 50],
  hip: [-25, 125],
  hipL: [-25, 125],
  hipR: [-25, 125],
  hipAbd: [-5, 50],
  knee: [0, 148],
  kneeL: [0, 148],
  kneeR: [0, 148],
  ankle: [-35, 75],
  ankleL: [-35, 75],
  ankleR: [-35, 75],
  sh: [-60, 185],
  shL: [-60, 185],
  shR: [-60, 185],
  abd: [-10, 185],
  abdL: [-10, 185],
  abdR: [-10, 185],
  hor: [-40, 135],
  horL: [-40, 135],
  horR: [-40, 135],
  el: [0, 150],
  elL: [0, 150],
  elR: [0, 150],
  shrug: [0, 0.07],
};

/** Ajusta una postura a los rangos humanos. Devuelve también qué articulaciones se salían (para auditar). */
export function clampPose(p: Pose): { pose: Pose; hits: string[] } {
  const pose: Pose = { ...p };
  const hits: string[] = [];
  for (const k of Object.keys(p) as (keyof Pose)[]) {
    const r = ROM[k];
    const v = p[k];
    if (!r || v === undefined) continue;
    const c = Math.min(r[1], Math.max(r[0], v));
    if (c !== v) {
      hits.push(`${k} ${Math.round(v)}° (máx. ${v > r[1] ? r[1] : r[0]}°)`);
      pose[k] = c;
    }
  }
  return { pose, hits };
}

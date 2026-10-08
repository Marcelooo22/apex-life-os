import type { HandsCtx, HandsFn, HandsOut, Motion, Pose, V3 } from "./types";

/** Cada ejercicio del catálogo → un movimiento de ida y vuelta entre la postura A y la B. */
const SEAT: Pose = { hip: 90, knee: 90 };
const SUP: Pose = { hip: 15, knee: 95 }; // boca arriba en el banco: muslos casi en línea con el tronco y pies apoyados
const BAR = { t: "bar", on: "hands" } as const;
const DB = { t: "db" } as const;
const BENCH = { t: "bench" } as const;
const mix = (base: Pose, extra: Pose): Pose => ({ ...base, ...extra });

/* ---- Manos guiadas (cinemática inversa): se describe dónde van las manos y el codo se coloca solo ---- */
const lerp3 = (a: V3, b: V3, s: number): V3 => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
type Side = 1 | -1; // 1 = mano izquierda de la persona (x+), -1 = derecha
/** Hombro de ese lado, en el mundo. */
const shp = (c: HandsCtx, k: Side): V3 => c.sh[k > 0 ? "L" : "R"];
/** Punto relativo al hombro (en el mundo). */
const off = (c: HandsCtx, k: Side, x: number, y: number, z: number): V3 => {
  const p = shp(c, k);
  return [p[0] + x, p[1] + y, p[2] + z];
};
/** Mano de A a B (cada una función del lado); `pole` indica hacia dónde apunta el codo. */
const IK = (a: (c: HandsCtx, k: Side) => V3, b: (c: HandsCtx, k: Side) => V3, pole?: (c: HandsCtx, k: Side) => V3): HandsFn => (s, c) => {
  const o = {} as HandsOut;
  for (const k of [1, -1] as const) {
    const v = lerp3(a(c, k), b(c, k), s);
    if (k > 0) {
      o.L = v;
      if (pole) o.poleL = pole(c, k);
    } else {
      o.R = v;
      if (pole) o.poleR = pole(c, k);
    }
  }
  return o;
};
const HANG = (c: HandsCtx, k: Side) => off(c, k, k * 0.04, -0.585, 0.02); // brazos colgando rectos bajo los hombros

export const MOTIONS: Record<string, Motion> = {
  /* ---------- Pecho ---------- */
  "press-banca": { rootX: -90, view: 60, props: [BENCH, BAR], a: SUP, b: SUP, hands: IK((c, k) => c.t(k * 0.26, 0.32, 0.17), (c, k) => c.t(k * 0.24, 0.46, 0.58), (c, k) => c.dir(k * 0.8, -0.3, -0.6)) },
  "press-banca-inclinado": { rootX: -90, view: 70, props: [BENCH, BAR], a: mix(SUP, { hinge: 45 }), b: mix(SUP, { hinge: 45 }), hands: IK((c, k) => c.t(k * 0.26, 0.32, 0.17), (c, k) => off(c, k, k * 0.04, 0.58, 0.04), (c, k) => c.dir(k * 0.8, -0.3, -0.6)) },
  "press-mancuernas": { rootX: -90, view: 60, props: [BENCH, DB], a: SUP, b: SUP, hands: IK((c, k) => c.t(k * 0.36, 0.32, 0.14), (c, k) => c.t(k * 0.18, 0.46, 0.58), (c, k) => c.dir(k * 0.8, -0.3, -0.6)) },
  "press-inclinado-mancuernas": { rootX: -90, view: 70, props: [BENCH, DB], a: mix(SUP, { hinge: 45 }), b: mix(SUP, { hinge: 45 }), hands: IK((c, k) => c.t(k * 0.36, 0.32, 0.14), (c, k) => off(c, k, -k * 0.03, 0.58, 0.04), (c, k) => c.dir(k * 0.8, -0.3, -0.6)) },
  aperturas: { rootX: -90, view: 25, props: [BENCH, DB], a: mix(SUP, { sh: 5, abd: 85, el: 25 }), b: mix(SUP, { sh: 88, abd: 4, el: 15 }) },
  "cruce-poleas": { view: 20, props: [DB, { t: "cable", anchor: [0.9, 2.2, 0], to: "left" }, { t: "cable", anchor: [-0.9, 2.2, 0], to: "right" }], a: { hinge: 12, hip: 8, knee: 12, sh: 20, abd: 80, el: 20 }, b: { hinge: 12, hip: 8, knee: 12, sh: 55, abd: 8, el: 15 } },
  fondos: { ground: "hands", barY: 1.02, view: 80, props: [{ t: "dipbars", y: 1.02 }], a: { sh: -8, el: 3, hip: 10, knee: 100, hinge: 5 }, b: { sh: -35, el: 95, hip: 10, knee: 100, hinge: 25 } },
  flexiones: { ground: "plank", rootX: 90, flat: false, view: 85, a: { sh: 90, el: 4, ankle: 72 }, b: { sh: 70, el: 100, ankle: 72 } },
  "press-pecho-maquina": { view: 70, props: [{ t: "seat", back: true }, { t: "machine", kind: "chest" }], a: SEAT, b: SEAT, hands: IK((c, k) => c.t(k * 0.3, 0.36, 0.15), (c, k) => c.t(k * 0.1, 0.38, 0.58), (c, k) => c.dir(k * 0.8, -0.4, -0.5)) },
  "peck-deck": { view: 35, props: [{ t: "seat", back: true }, { t: "machine", kind: "pecdeck" }], a: SEAT, b: SEAT, hands: IK((c, k) => c.t(k * 0.52, 0.42, 0.22), (c, k) => c.t(k * 0.05, 0.42, 0.52), (c, k) => c.dir(k * 0.3, -0.3, -1)) },
  /* ---------- Hombros ---------- */
  "press-militar": { view: 70, props: [BAR], a: { hip: 3, knee: 3 }, b: { hip: 3, knee: 3 }, hands: IK((c, k) => c.t(k * 0.22, 0.5, 0.17), (c, k) => off(c, k, -k * 0.03, 0.6, 0.04), (c, k) => c.dir(k * 0.3, -0.8, 0.3)) },
  "press-hombro-mancuernas": { view: 25, props: [{ t: "seat", back: true }, DB], a: SEAT, b: SEAT, hands: IK((c, k) => c.t(k * 0.34, 0.54, 0.04), (c, k) => off(c, k, -k * 0.1, 0.6, 0.02), (c, k) => c.dir(k * 0.7, -0.7, -0.1)) },
  "press-arnold": { view: 25, props: [{ t: "seat", back: true }, DB], a: SEAT, b: SEAT, hands: IK((c, k) => c.t(k * 0.12, 0.42, 0.22), (c, k) => off(c, k, -k * 0.1, 0.6, 0.02), (c, k) => c.dir(k * 0.5, -0.8, 0.2)) },
  "press-hombro-maquina": { view: 60, props: [{ t: "seat", back: true }, { t: "machine", kind: "shoulder" }], a: SEAT, b: SEAT, hands: IK((c, k) => c.t(k * 0.32, 0.52, 0.1), (c, k) => off(c, k, -k * 0.06, 0.6, 0.03), (c, k) => c.dir(k * 0.7, -0.7, -0.2)) },
  "elevaciones-laterales": { view: 15, props: [DB], a: { sh: 4, abd: 6, el: 15 }, b: { sh: 8, abd: 88, el: 15 } },
  "elevaciones-frontales": { view: 80, props: [DB], a: { sh: 4, el: 8 }, b: { sh: 90, el: 8 } },
  pajaros: { view: 40, props: [DB], a: { hinge: 70, hip: 25, knee: 30, sh: 70, el: 15 }, b: { hinge: 70, hip: 25, knee: 30, sh: 5, abd: 88, el: 15 } },
  "face-pull": { view: 80, props: [{ t: "cable", anchor: [0, 1.55, 1.7] }], a: { hip: 4, knee: 4, sh: 85, abd: 8, el: 8 }, b: { hip: 4, knee: 4, sh: 85, abd: 55, el: 125 } },
  /* ---------- Tríceps ---------- */
  "triceps-polea": { view: 80, props: [{ t: "cable", anchor: [0, 2.3, 0.2] }], a: { hinge: 8, sh: 8, el: 105 }, b: { hinge: 8, sh: 8, el: 4 } },
  "press-frances": { rootX: -90, view: 80, props: [BENCH, BAR], a: mix(SUP, { sh: 88, el: 110 }), b: mix(SUP, { sh: 88, el: 4 }) },
  "fondos-banco": { ground: "hands", barY: 0.5, view: 80, props: [{ t: "handbench" }], a: { sh: -15, el: 4, hip: 85, knee: 15, hinge: -10 }, b: { sh: -45, el: 95, hip: 85, knee: 15, hinge: -10 } },
  "patada-triceps": { view: 80, props: [DB], a: { hinge: 70, hip: 25, knee: 30, sh: 25, el: 95 }, b: { hinge: 70, hip: 25, knee: 30, sh: 15, el: 5 } },
  "triceps-cabeza": { view: 80, props: [DB], a: { sh: 168, el: 130 }, b: { sh: 168, el: 5 } },
  "press-cerrado": { rootX: -90, view: 60, props: [BENCH, BAR], a: SUP, b: SUP, hands: IK((c, k) => c.t(k * 0.12, 0.32, 0.17), (c, k) => c.t(k * 0.12, 0.46, 0.58), (c, k) => c.dir(k * 0.3, -0.3, -0.9)) },
  /* ---------- Bíceps ---------- */
  "curl-barra": { view: 80, props: [BAR], a: { sh: 3, el: 5 }, b: { sh: 12, el: 138 } },
  "curl-mancuernas": { view: 40, props: [DB], a: { sh: 3, el: 5 }, b: { sh: 10, el: 138 } },
  "curl-martillo": { view: 40, props: [DB], a: { sh: 3, el: 5 }, b: { sh: 10, el: 138 } },
  "curl-predicador": { view: 80, props: [{ t: "seat" }, { t: "pad" }, BAR], a: mix(SEAT, { hinge: 15, sh: 55, el: 8 }), b: mix(SEAT, { hinge: 15, sh: 55, el: 130 }) },
  "curl-polea": { view: 80, props: [BAR, { t: "cable", anchor: [0, 0.12, 0.7] }], a: { sh: 3, el: 5 }, b: { sh: 12, el: 138 } },
  "curl-inclinado": { view: 80, props: [DB], a: { hinge: -25, sh: -22, el: 5 }, b: { hinge: -25, sh: -22, el: 135 } },
  "curl-concentrado": { view: 50, props: [{ t: "seat" }, DB], a: mix(SEAT, { hinge: 40, sh: 40, elR: 5, elL: 5, hipAbd: 12 }), b: mix(SEAT, { hinge: 40, sh: 40, elR: 5, elL: 125, hipAbd: 12 }) },
  /* ---------- Espalda ---------- */
  dominadas: { ground: "hands", barY: 2.2, view: 35, props: [{ t: "pullbar", y: 2.2 }], a: { sh: 172, abd: 28, el: 3, hip: 6, knee: 40 }, b: { sh: 140, abd: 38, el: 112, hip: 6, knee: 40, hinge: -6 } },
  "jalon-pecho": { view: 30, props: [{ t: "seat" }, { t: "machine", kind: "lat" }], a: mix(SEAT, { hinge: -4 }), b: mix(SEAT, { hinge: -10 }), hands: IK((c, k) => off(c, k, k * 0.28, 0.52, 0.08), (c, k) => c.t(k * 0.28, 0.36, 0.17), (c, k) => c.dir(k * 0.6, -0.8, -0.3)) },
  "remo-barra": { view: 80, props: [BAR], a: { hinge: 65, hip: 22, knee: 28 }, b: { hinge: 65, hip: 22, knee: 28 }, hands: IK((c, k) => HANG(c, k), (c, k) => c.t(k * 0.25, 0.18, 0.16), (c, k) => c.dir(k * 0.3, 0.1, -1)) },
  "remo-mancuerna": { view: 60, props: [DB], a: { hinge: 65, hip: 22, knee: 28 }, b: { hinge: 65, hip: 22, knee: 28 }, hands: (s, c) => ({ L: HANG(c, 1), R: lerp3(HANG(c, -1), c.t(-0.24, 0.2, 0.15), s), poleR: c.dir(-0.3, 0.1, -1), poleL: [0.4, -1, -0.3] }) },
  "remo-polea": { view: 80, props: [{ t: "seat" }, { t: "cable", anchor: [0, 0.45, 1.9] }, { t: "machine", kind: "row" }], a: mix(SEAT, { hip: 80, knee: 25, hinge: 8 }), b: mix(SEAT, { hip: 80, knee: 25, hinge: -6 }), hands: IK((c, k) => off(c, k, 0, -0.12, 0.56), (c, k) => c.t(k * 0.12, 0.15, 0.15), (c, k) => c.dir(k * 0.6, -0.2, -0.8)) },
  "remo-maquina": { view: 80, props: [{ t: "seat", back: true }, { t: "machine", kind: "chest" }], a: SEAT, b: SEAT, hands: IK((c, k) => c.t(k * 0.15, 0.4, 0.56), (c, k) => c.t(k * 0.12, 0.34, 0.12), (c, k) => c.dir(k * 0.7, -0.2, -0.9)) },
  "remo-t": { view: 80, props: [BAR], a: { hinge: 60, hip: 25, knee: 35 }, b: { hinge: 60, hip: 25, knee: 35 }, hands: IK((c, k) => HANG(c, k), (c, k) => c.t(k * 0.14, 0.2, 0.15), (c, k) => c.dir(k * 0.4, 0.1, -1)) },
  pullover: { rootX: -90, view: 80, props: [BENCH, DB], a: mix(SUP, { sh: 160, el: 20 }), b: mix(SUP, { sh: 88, el: 15 }) },
  "peso-muerto": { view: 80, props: [BAR], a: { hinge: 62, hip: 40, knee: 55 }, b: { hinge: 0, hip: 0, knee: 0 }, hands: IK(HANG, HANG) },
  encogimientos: { view: 40, props: [DB], a: { sh: 2, shrug: 0 }, b: { sh: 2, shrug: 0.05 } },
  /* ---------- Piernas ---------- */
  "sentadilla": { view: 78, props: [{ t: "bar", on: "back" }], a: { hinge: 6, hip: 5, knee: 6 }, b: { hinge: 36, hip: 118, knee: 138 }, hands: IK((c, k) => c.t(k * 0.3, 0.44, -0.1), (c, k) => c.t(k * 0.3, 0.44, -0.1), (c, k) => c.dir(k * 0.3, -0.6, -1)) },
  "sentadilla-frontal": { view: 78, props: [{ t: "bar", on: "front" }], a: { hinge: 4, hip: 5, knee: 6 }, b: { hinge: 18, hip: 118, knee: 138 }, hands: IK((c, k) => c.t(k * 0.12, 0.45, 0.15), (c, k) => c.t(k * 0.12, 0.45, 0.15), (c, k) => c.dir(k * 0.15, 0.6, 0.8)) },
  "sentadilla-goblet": { view: 78, props: [DB], a: { hinge: 4, hip: 5, knee: 6 }, b: { hinge: 22, hip: 118, knee: 138 }, hands: IK((c, k) => c.t(k * 0.05, 0.3, 0.21), (c, k) => c.t(k * 0.05, 0.3, 0.21), (c, k) => c.dir(k * 0.2, -1, 0.1)) },
  "prensa": { rootX: -58, ground: "all", raise: 0.22, view: 85, props: [{ t: "seat", back: true }, { t: "machine", kind: "legpress" }], a: { hip: 105, knee: 125, sh: 20, el: 90 }, b: { hip: 82, knee: 12, sh: 20, el: 90 } },
  zancadas: { view: 80, plant: "R", props: [DB], a: { hipL: 12, kneeL: 12, hipR: -8, kneeR: 20, sh: 3 }, b: { hipL: 88, kneeL: 92, hipR: -22, kneeR: 90, sh: 3 } },
  "extension-cuadriceps": { view: 85, flat: false, props: [{ t: "seat", back: true }, { t: "machine", kind: "legext" }], a: mix(SEAT, { knee: 95 }), b: mix(SEAT, { knee: 5 }) },
  "curl-femoral-tumbado": { rootX: 90, view: 85, ground: "all", flat: false, props: [{ t: "bench" }, { t: "machine", kind: "legcurlLying" }], a: { knee: 2 }, b: { knee: 115 } },
  "curl-femoral-sentado": { view: 85, flat: false, props: [{ t: "seat", back: true }, { t: "machine", kind: "legcurl" }], a: mix(SEAT, { knee: 10 }), b: mix(SEAT, { knee: 100 }) },
  "peso-muerto-rumano": { view: 80, props: [BAR], a: { hinge: 70, hip: 12, knee: 14 }, b: { hinge: 0, hip: 0, knee: 0 }, hands: IK(HANG, HANG) },
  "hip-thrust": { rootX: -90, ground: "all", view: 85, a: { hip: 65, knee: 100, lift: 0, sh: 20, el: 5 }, b: { hip: 18, knee: 95, lift: 22, sh: 20, el: 5 } },
  "puente-gluteo": { rootX: -90, ground: "all", view: 85, a: { hip: 65, knee: 100, lift: 0, sh: 10 }, b: { hip: 18, knee: 95, lift: 22, sh: 10 } },
  "abduccion-maquina": { view: 20, props: [{ t: "seat", back: true }, { t: "machine", kind: "abductor" }], a: mix(SEAT, { hipAbd: 3 }), b: mix(SEAT, { hipAbd: 35 }) },
  "hack-squat": { view: 80, props: [{ t: "machine", kind: "hack" }], a: { hinge: -2, hip: 8, knee: 10 }, b: { hinge: -2, hip: 100, knee: 118 } },
  "gemelos-pie": { view: 80, a: { ankle: 0 }, b: { ankle: 42 } },
  "gemelos-sentado": { view: 80, props: [{ t: "seat" }], a: mix(SEAT, { ankle: 0 }), b: mix(SEAT, { ankle: 35 }) },
  /* ---------- Core ---------- */
  plancha: { ground: "plank", rootX: 90, flat: false, hold: true, view: 80, a: { sh: 90, el: 90, ankle: 72 }, b: { sh: 90, el: 90, ankle: 72, hip: 3 } },
  crunch: { rootX: -90, ground: "all", view: 80, a: { hip: 65, knee: 100, sh: 150, abd: 25, el: 125, hinge: 0, neck: 0 }, b: { hip: 65, knee: 100, sh: 150, abd: 25, el: 125, hinge: 35, neck: 10 } },
  "elevacion-piernas": { ground: "hands", barY: 2.2, view: 80, props: [{ t: "pullbar", y: 2.2 }], a: { sh: 172, abd: 15, el: 3, hip: 4, knee: 6 }, b: { sh: 172, abd: 15, el: 3, hip: 88, knee: 6, hinge: -5 } },
  "russian-twist": { rootX: -45, ground: "all", view: 25, flat: false, a: { hip: 75, knee: 60, hinge: 55, twist: 45, sh: 75, el: 70 }, b: { hip: 75, knee: 60, hinge: 55, twist: -45, sh: 75, el: 70 } },
  "crunch-polea": { ground: "all", view: 80, props: [{ t: "cable", anchor: [0, 2.4, 0.1] }], flat: false, a: { hip: 2, knee: 92, ankle: 72, hinge: 8, sh: 150, el: 130 }, b: { hip: 2, knee: 92, ankle: 72, hinge: 65, sh: 150, el: 130 } },
  "rueda-abdominal": { ground: "all", view: 80, props: [{ t: "wheel" }], flat: false, a: { hip: 2, knee: 92, ankle: 72, hinge: 10, sh: 80, el: 8 }, b: { hip: 2, knee: 92, ankle: 72, hinge: 85, sh: 160, el: 4 } },
};

export const hasMotion = (catalogId: string) => catalogId in MOTIONS;

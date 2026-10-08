import type { Motion, Pose } from "./types";

/** Cada ejercicio del catálogo → un movimiento de ida y vuelta entre la postura A y la B. */
const SEAT: Pose = { hip: 90, knee: 90 };
const SUP: Pose = { hip: 70, knee: 100 }; // boca arriba con los pies apoyados
const BAR = { t: "bar", on: "hands" } as const;
const DB = { t: "db" } as const;
const BENCH = { t: "bench" } as const;
const mix = (base: Pose, extra: Pose): Pose => ({ ...base, ...extra });

export const MOTIONS: Record<string, Motion> = {
  /* ---------- Pecho ---------- */
  "press-banca": { rootX: -90, view: 60, props: [BENCH, BAR], a: mix(SUP, { sh: 10, abd: 70, el: 95 }), b: mix(SUP, { sh: 88, abd: 5, el: 4 }) },
  "press-banca-inclinado": { rootX: -90, view: 70, props: [BENCH, BAR], a: mix(SUP, { hinge: 45, sh: 55, abd: 60, el: 95 }), b: mix(SUP, { hinge: 45, sh: 133, abd: 5, el: 4 }) },
  "press-mancuernas": { rootX: -90, view: 60, props: [BENCH, DB], a: mix(SUP, { sh: 10, abd: 70, el: 95 }), b: mix(SUP, { sh: 88, abd: 5, el: 4 }) },
  "press-inclinado-mancuernas": { rootX: -90, view: 70, props: [BENCH, DB], a: mix(SUP, { hinge: 45, sh: 55, abd: 60, el: 95 }), b: mix(SUP, { hinge: 45, sh: 133, abd: 5, el: 4 }) },
  aperturas: { rootX: -90, view: 25, props: [BENCH, DB], a: mix(SUP, { sh: 5, abd: 85, el: 25 }), b: mix(SUP, { sh: 88, abd: 4, el: 15 }) },
  "cruce-poleas": { view: 20, props: [DB, { t: "cable", anchor: [0.9, 2.2, 0], to: "left" }, { t: "cable", anchor: [-0.9, 2.2, 0], to: "right" }], a: { hinge: 12, hip: 8, knee: 12, sh: 20, abd: 80, el: 20 }, b: { hinge: 12, hip: 8, knee: 12, sh: 55, abd: 8, el: 15 } },
  fondos: { ground: "hands", barY: 1.02, view: 80, props: [{ t: "dipbars", y: 1.02 }], a: { sh: -8, el: 3, hip: 10, knee: 100, hinge: 5 }, b: { sh: -35, el: 95, hip: 10, knee: 100, hinge: 25 } },
  flexiones: { ground: "plank", rootX: 90, flat: false, view: 85, a: { sh: 90, el: 4, ankle: 80 }, b: { sh: 70, el: 100, ankle: 80 } },
  "press-pecho-maquina": { view: 70, props: [{ t: "seat", back: true }], a: mix(SEAT, { sh: 40, abd: 35, el: 105 }), b: mix(SEAT, { sh: 88, abd: 8, el: 6 }) },
  "peck-deck": { view: 35, props: [{ t: "seat", back: true }], a: mix(SEAT, { sh: 80, hor: 60, el: 95 }), b: mix(SEAT, { sh: 85, hor: 0, el: 95 }) },
  /* ---------- Hombros ---------- */
  "press-militar": { view: 70, props: [BAR], a: { hip: 3, knee: 3, sh: 25, abd: 25, el: 135 }, b: { hip: 3, knee: 3, sh: 168, abd: 12, el: 4 } },
  "press-hombro-mancuernas": { view: 25, props: [{ t: "seat", back: true }, DB], a: mix(SEAT, { sh: 15, abd: 80, el: 100 }), b: mix(SEAT, { sh: 160, abd: 18, el: 5 }) },
  "press-arnold": { view: 25, props: [{ t: "seat", back: true }, DB], a: mix(SEAT, { sh: 70, abd: 20, el: 135 }), b: mix(SEAT, { sh: 160, abd: 18, el: 5 }) },
  "press-hombro-maquina": { view: 60, props: [{ t: "seat", back: true }], a: mix(SEAT, { sh: 15, abd: 70, el: 100 }), b: mix(SEAT, { sh: 160, abd: 18, el: 5 }) },
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
  "press-cerrado": { rootX: -90, view: 60, props: [BENCH, BAR], a: mix(SUP, { sh: 10, abd: 20, el: 95 }), b: mix(SUP, { sh: 88, abd: 3, el: 4 }) },
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
  "jalon-pecho": { view: 30, props: [{ t: "seat" }, { t: "cable", anchor: [0, 2.4, 0.15] }], a: mix(SEAT, { sh: 165, abd: 38, el: 6, hinge: -4 }), b: mix(SEAT, { sh: 70, abd: 52, el: 105, hinge: -12 }) },
  "remo-barra": { view: 80, props: [BAR], a: { hinge: 65, hip: 22, knee: 28, sh: 65, el: 5 }, b: { hinge: 65, hip: 22, knee: 28, sh: 8, el: 95 } },
  "remo-mancuerna": { view: 60, props: [DB], a: { hinge: 65, hip: 22, knee: 28, shL: 65, shR: 65, elL: 5, elR: 5 }, b: { hinge: 65, hip: 22, knee: 28, shL: 65, shR: 5, elL: 5, elR: 95 } },
  "remo-polea": { view: 80, props: [{ t: "seat" }, { t: "cable", anchor: [0, 0.4, 1.9] }], a: mix(SEAT, { hip: 80, knee: 25, hinge: 8, sh: 85, el: 5 }), b: mix(SEAT, { hip: 80, knee: 25, hinge: -6, sh: 8, el: 100 }) },
  "remo-maquina": { view: 80, props: [{ t: "seat", back: true }], a: mix(SEAT, { sh: 85, el: 5 }), b: mix(SEAT, { sh: 8, el: 100 }) },
  "remo-t": { view: 80, props: [BAR], a: { hinge: 60, hip: 25, knee: 35, sh: 60, el: 5 }, b: { hinge: 60, hip: 25, knee: 35, sh: 10, el: 95 } },
  pullover: { rootX: -90, view: 80, props: [BENCH, DB], a: mix(SUP, { sh: 160, el: 20 }), b: mix(SUP, { sh: 88, el: 15 }) },
  "peso-muerto": { view: 80, props: [BAR], a: { hinge: 62, hip: 40, knee: 55, sh: 62, el: 3 }, b: { hinge: 0, hip: 0, knee: 0, sh: 0, el: 3 } },
  encogimientos: { view: 40, props: [DB], a: { sh: 2, shrug: 0 }, b: { sh: 2, shrug: 0.05 } },
  /* ---------- Piernas ---------- */
  sentadilla: { view: 78, props: [{ t: "bar", on: "back" }], a: { hinge: 6, hip: 5, knee: 6, sh: -25, abd: 55, el: 100 }, b: { hinge: 36, hip: 118, knee: 138, sh: -25, abd: 55, el: 100 } },
  "sentadilla-frontal": { view: 78, props: [{ t: "bar", on: "front" }], a: { hinge: 4, hip: 5, knee: 6, sh: 70, abd: 10, el: 140 }, b: { hinge: 18, hip: 118, knee: 138, sh: 70, abd: 10, el: 140 } },
  "sentadilla-goblet": { view: 78, props: [DB], a: { hinge: 4, hip: 5, knee: 6, sh: 55, el: 140 }, b: { hinge: 22, hip: 118, knee: 138, sh: 55, el: 140 } },
  prensa: { rootX: -55, view: 85, a: { hip: 105, knee: 125 }, b: { hip: 80, knee: 12 } },
  zancadas: { view: 80, plant: "R", props: [DB], a: { hipL: 12, kneeL: 12, hipR: -8, kneeR: 20, sh: 3 }, b: { hipL: 88, kneeL: 92, hipR: -22, kneeR: 90, sh: 3 } },
  "extension-cuadriceps": { view: 85, props: [{ t: "seat", back: true }], flat: false, a: mix(SEAT, { knee: 95 }), b: mix(SEAT, { knee: 5 }) },
  "curl-femoral-tumbado": { rootX: 90, view: 85, ground: "all", flat: false, props: [{ t: "bench" }], a: { knee: 2 }, b: { knee: 115 } },
  "curl-femoral-sentado": { view: 85, flat: false, props: [{ t: "seat", back: true }], a: mix(SEAT, { knee: 10 }), b: mix(SEAT, { knee: 100 }) },
  "peso-muerto-rumano": { view: 80, props: [BAR], a: { hinge: 70, hip: 12, knee: 14, sh: 70, el: 3 }, b: { hinge: 0, hip: 0, knee: 0, sh: 0, el: 3 } },
  "hip-thrust": { rootX: -90, ground: "all", view: 85, a: { hip: 65, knee: 100, lift: 0, sh: 20, el: 5 }, b: { hip: 18, knee: 95, lift: 22, sh: 20, el: 5 } },
  "puente-gluteo": { rootX: -90, ground: "all", view: 85, a: { hip: 65, knee: 100, lift: 0, sh: 10 }, b: { hip: 18, knee: 95, lift: 22, sh: 10 } },
  "abduccion-maquina": { view: 20, props: [{ t: "seat", back: true }], a: mix(SEAT, { hipAbd: 3 }), b: mix(SEAT, { hipAbd: 35 }) },
  "hack-squat": { view: 80, a: { hinge: -2, hip: 8, knee: 10 }, b: { hinge: -2, hip: 110, knee: 125 } },
  "gemelos-pie": { view: 80, a: { ankle: 0 }, b: { ankle: 42 } },
  "gemelos-sentado": { view: 80, props: [{ t: "seat" }], a: mix(SEAT, { ankle: 0 }), b: mix(SEAT, { ankle: 35 }) },
  /* ---------- Core ---------- */
  plancha: { ground: "plank", rootX: 90, flat: false, hold: true, view: 80, a: { sh: 90, el: 90, ankle: 80 }, b: { sh: 90, el: 90, ankle: 80, hip: 3 } },
  crunch: { rootX: -90, ground: "all", view: 80, a: { hip: 65, knee: 100, sh: 150, abd: 25, el: 125, hinge: 0, neck: 0 }, b: { hip: 65, knee: 100, sh: 150, abd: 25, el: 125, hinge: 35, neck: 10 } },
  "elevacion-piernas": { ground: "hands", barY: 2.2, view: 80, props: [{ t: "pullbar", y: 2.2 }], a: { sh: 172, abd: 15, el: 3, hip: 4, knee: 6 }, b: { sh: 172, abd: 15, el: 3, hip: 88, knee: 6, hinge: -5 } },
  "russian-twist": { rootX: -45, ground: "all", view: 25, flat: false, a: { hip: 75, knee: 60, hinge: 55, twist: 45, sh: 75, el: 70 }, b: { hip: 75, knee: 60, hinge: 55, twist: -45, sh: 75, el: 70 } },
  "crunch-polea": { ground: "all", view: 80, props: [{ t: "cable", anchor: [0, 2.4, 0.1] }], flat: false, a: { hip: 2, knee: 92, ankle: 80, hinge: 8, sh: 150, el: 130 }, b: { hip: 2, knee: 92, ankle: 80, hinge: 65, sh: 150, el: 130 } },
  "rueda-abdominal": { ground: "all", view: 80, props: [{ t: "wheel" }], flat: false, a: { hip: 2, knee: 92, ankle: 80, hinge: 10, sh: 80, el: 8 }, b: { hip: 2, knee: 92, ankle: 80, hinge: 85, sh: 160, el: 4 } },
};

export const hasMotion = (catalogId: string) => catalogId in MOTIONS;

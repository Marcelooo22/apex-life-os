/** Ángulos en grados. Positivo = hacia delante (flexión), salvo donde se indique. */
export interface Pose {
  /** Inclinación del torso respecto a la pelvis (+ hacia delante). */
  hinge?: number;
  /** Giro del torso sobre su eje (+ hacia la izquierda de la persona). */
  twist?: number;
  neck?: number;
  hip?: number;
  hipL?: number;
  hipR?: number;
  /** Separación lateral de las piernas. */
  hipAbd?: number;
  knee?: number;
  kneeL?: number;
  kneeR?: number;
  /** Flexión plantar extra (+ puntas hacia abajo) sobre el pie plano automático. */
  ankle?: number;
  ankleL?: number;
  ankleR?: number;
  /** Hombro: flexión (+ brazo hacia delante). */
  sh?: number;
  shL?: number;
  shR?: number;
  /** Hombro: separación lateral (+ hacia fuera). */
  abd?: number;
  abdL?: number;
  abdR?: number;
  /** Giro horizontal del brazo cuando está al frente (+ hacia fuera). */
  hor?: number;
  horL?: number;
  horR?: number;
  /** Codo: flexión. */
  el?: number;
  elL?: number;
  elR?: number;
  /** Elevación de hombros en metros (encogimientos). */
  shrug?: number;
  /** Cadera hacia arriba en puentes (grados de giro del cuerpo entero). */
  lift?: number;
}

export type Prop =
  | { t: "bar"; on: "hands" | "back" | "front" }
  | { t: "db" }
  | { t: "cable"; anchor: [number, number, number]; to?: "hands" | "left" | "right" }
  | { t: "pullbar"; y: number }
  | { t: "dipbars"; y: number }
  | { t: "bench"; tilt?: number }
  | { t: "seat"; back?: boolean }
  | { t: "pad" }
  | { t: "handbench" }
  | { t: "stepbox" }
  | { t: "wheel" };

export interface Motion {
  /** Giro base del cuerpo: 0 de pie, -90 boca arriba, 90 boca abajo. */
  rootX?: number;
  /** Cómo se apoya: pies (por defecto), todo el cuerpo, colgado de las manos, o plancha. */
  ground?: "feet" | "all" | "hands" | "plank";
  /** Altura de la barra cuando se cuelga. */
  barY?: number;
  /** Mantener los pies planos en el suelo (por defecto sí). */
  flat?: boolean;
  /** Ajusta la rodilla de esta pierna para que su pie toque el suelo. */
  plant?: "L" | "R";
  props?: Prop[];
  a: Pose;
  b: Pose;
  /** Ángulo de la cámara en grados (0 de frente, 90 de lado). */
  view?: number;
  /** Ejercicio isométrico: solo se mantiene la posición. */
  hold?: boolean;
}

import * as THREE from "three";
import type { Zone } from "../exercises";
import type { Pose } from "./types";

const D = Math.PI / 180;
export const SKIN = 0xc9d1de;
export const MUSCLE = 0x52698c;
export const PRIMARY = 0xe0262c;
export const SECONDARY = 0xf0900a;

export type BodySex = "male" | "female";

const LEN = { thigh: 0.44, shin: 0.43, ankleH: 0.075, torso: 0.5, upper: 0.29, fore: 0.26 };
const ZONES: Zone[] = ["pecho", "hombros", "biceps", "triceps", "antebrazos", "abdomen", "oblicuos", "dorsales", "trapecio", "lumbar", "gluteos", "cuadriceps", "isquios", "gemelos"];

export interface Figure {
  /** Lo que se añade a la escena (la raíz, y en el cuerpo con piel, también las mallas con esqueleto). */
  holder: THREE.Object3D;
  root: THREE.Object3D;
  torso: THREE.Object3D;
  neck: THREE.Object3D;
  hip: Record<"L" | "R", THREE.Object3D>;
  knee: Record<"L" | "R", THREE.Object3D>;
  ankle: Record<"L" | "R", THREE.Object3D>;
  sh: Record<"L" | "R", THREE.Object3D>;
  arm: Record<"L" | "R", THREE.Object3D>;
  elbow: Record<"L" | "R", THREE.Object3D>;
  hand: Record<"L" | "R", THREE.Object3D>;
  toe: Record<"L" | "R", THREE.Object3D>;
  heel: Record<"L" | "R", THREE.Object3D>;
  head: THREE.Object3D;
  /** Colorea los músculos: principales en rojo, secundarios en ámbar. */
  paint: (primary: Zone[], secondary: Zone[]) => void;
  dispose: () => void;
}

/** Medidas del esqueleto que comparten el maniquí de piezas y el cuerpo con piel. */
export const BODY = {
  male: { hipW: 0.095, shW: 0.2 },
  female: { hipW: 0.1, shW: 0.183 },
} as const;
export const BONE_LEN = LEN;

/** Superficie de revolución suave (muslos, brazos, tronco…) a partir de radios a lo largo de un eje vertical. */
function smooth(points: [number, number][], segments = 28): THREE.LatheGeometry {
  const curve = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)));
  return new THREE.LatheGeometry(curve.getPoints(36), segments);
}

/** Miembro colgante de longitud `len`: radios repartidos de arriba abajo, con extremos redondeados. */
function limb(len: number, radii: number[]): THREE.LatheGeometry {
  const n = radii.length;
  const pts: [number, number][] = [[0.0001, 0.0]];
  radii.forEach((r, i) => pts.push([r, -len * (0.05 + (0.9 * i) / (n - 1))]));
  pts.push([0.0001, -len]);
  return smooth(pts);
}

export function createFigure(sex: BodySex = "male"): Figure {
  const F = sex === "female";
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const sphere = new THREE.SphereGeometry(1, 36, 24);
  geos.push(sphere);
  const skin = new THREE.MeshPhysicalMaterial({ color: SKIN, roughness: 0.66, clearcoat: 0.12, clearcoatRoughness: 0.5 });
  mats.push(skin);
  const zoneMat = {} as Record<Zone, THREE.MeshPhysicalMaterial>;
  for (const z of ZONES) {
    zoneMat[z] = new THREE.MeshPhysicalMaterial({ color: MUSCLE, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.35, emissive: 0x000000 });
    mats.push(zoneMat[z]);
  }

  const k = F ? 0.92 : 1; // los músculos de ella, algo más finos
  const hipW = F ? 0.1 : 0.095;
  const shW = F ? 0.183 : 0.2;
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.scale.set(...scale);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const ell = (parent: THREE.Object3D, mat: THREE.Material, s: [number, number, number], p: [number, number, number]) => add(parent, sphere, mat, p, s);
  const own = (g: THREE.BufferGeometry) => (geos.push(g), g);

  const root = new THREE.Group();
  // pelvis y glúteos
  ell(root, skin, [F ? 0.165 : 0.15, 0.1, 0.105], [0, -0.02, 0]);
  for (const sx of [1, -1]) ell(root, zoneMat.gluteos, [0.088 * k, 0.1 * k, 0.085 * k], [sx * (F ? 0.092 : 0.085), -0.035, -0.07]);

  // tronco: más ancho en pecho (hombre) o en cadera (mujer)
  const torso = new THREE.Group();
  root.add(torso);
  const torsoGeo = own(
    smooth(
      F
        ? [[0.0001, -0.01], [0.15, 0.0], [0.152, 0.05], [0.118, 0.15], [0.128, 0.24], [0.148, 0.335], [0.152, 0.4], [0.128, 0.465], [0.055, 0.5]]
        : [[0.0001, -0.01], [0.142, 0.0], [0.142, 0.05], [0.126, 0.15], [0.142, 0.24], [0.17, 0.34], [0.172, 0.41], [0.145, 0.47], [0.058, 0.5]],
    ),
  );
  add(torso, torsoGeo, skin, [0, 0, 0], [1, 1, 0.64]);
  for (const sx of [1, -1]) {
    ell(torso, zoneMat.pecho, [(F ? 0.072 : 0.086) * k, 0.07 * k, 0.05 * k], [sx * (F ? 0.075 : 0.088), 0.36, F ? 0.07 : 0.078]);
    ell(torso, zoneMat.oblicuos, [0.04 * k, 0.12 * k, 0.07 * k], [sx * (F ? 0.108 : 0.118), 0.18, 0.0]);
    ell(torso, zoneMat.dorsales, [0.092 * k, 0.15 * k, 0.045 * k], [sx * (F ? 0.082 : 0.095), 0.3, -0.07]);
    if (F) ell(torso, skin, [0.052, 0.05, 0.05], [sx * 0.07, 0.33, 0.093]);
  }
  ell(torso, zoneMat.abdomen, [0.082 * k, 0.13 * k, 0.04], [0, 0.17, 0.056]);
  ell(torso, zoneMat.trapecio, [0.13 * k, 0.075 * k, 0.045], [0, 0.46, -0.05]);
  ell(torso, zoneMat.lumbar, [0.08 * k, 0.075 * k, 0.042], [0, 0.09, -0.07]);

  // cuello y cabeza
  const neck = new THREE.Group();
  neck.position.set(0, 0.5, 0);
  torso.add(neck);
  add(neck, own(new THREE.CylinderGeometry(0.038, 0.047, 0.11, 20)), skin, [0, 0.05, 0]);
  const head = add(neck, sphere, skin, [0, 0.175, 0.01], [0.092, 0.112, 0.102]);
  add(neck, sphere, skin, [0, 0.13, 0.04], [0.066, 0.06, 0.068]); // mandíbula
  add(neck, sphere, skin, [0, 0.168, 0.108], [0.014, 0.02, 0.018]); // nariz: marca hacia dónde mira
  for (const sx of [1, -1]) add(neck, sphere, skin, [sx * 0.093, 0.172, 0.0], [0.014, 0.03, 0.02]); // orejas
  if (F) {
    add(neck, sphere, skin, [0, 0.16, -0.075], [0.08, 0.095, 0.07]);
    add(neck, sphere, skin, [0, 0.07, -0.1], [0.04, 0.09, 0.04]); // coleta
  }

  const hip = {} as Figure["hip"], knee = {} as Figure["knee"], ankle = {} as Figure["ankle"];
  const sh = {} as Figure["sh"], arm = {} as Figure["arm"], elbow = {} as Figure["elbow"];
  const hand = {} as Figure["hand"], toe = {} as Figure["toe"], heel = {} as Figure["heel"];
  const thighGeo = own(limb(LEN.thigh, F ? [0.07, 0.074, 0.062, 0.05, 0.04] : [0.066, 0.07, 0.058, 0.047, 0.037]));
  const shinGeo = own(limb(LEN.shin, [0.042, 0.046, 0.043, 0.032, 0.025]));
  const upperGeo = own(limb(LEN.upper, F ? [0.034, 0.036, 0.033, 0.028] : [0.04, 0.042, 0.038, 0.031]));
  const foreGeo = own(limb(LEN.fore, F ? [0.029, 0.032, 0.025, 0.018] : [0.034, 0.036, 0.028, 0.02]));

  for (const side of ["L", "R"] as const) {
    const sx = side === "L" ? 1 : -1;
    const h = new THREE.Group();
    h.position.set(sx * hipW, -0.02, 0);
    root.add(h);
    ell(h, skin, [0.062, 0.062, 0.062], [0, 0, 0]);
    add(h, thighGeo, skin);
    ell(h, zoneMat.cuadriceps, [0.067 * k, 0.2 * k, 0.062 * k], [0, -0.21, 0.034]);
    ell(h, zoneMat.isquios, [0.062 * k, 0.19 * k, 0.055 * k], [0, -0.21, -0.042]);
    const kn = new THREE.Group();
    kn.position.y = -LEN.thigh;
    h.add(kn);
    ell(kn, skin, [0.048, 0.048, 0.048], [0, 0, 0.004]);
    add(kn, shinGeo, skin);
    ell(kn, zoneMat.gemelos, [0.048 * k, 0.14 * k, 0.052 * k], [0, -0.13, -0.028]);
    const a = new THREE.Group();
    a.position.y = -LEN.shin;
    kn.add(a);
    ell(a, skin, [0.052, 0.036, 0.13], [0, -0.048, 0.055]); // pie
    ell(a, skin, [0.046, 0.05, 0.05], [0, -0.035, -0.035]); // talón
    const t = new THREE.Object3D();
    t.position.set(0, -LEN.ankleH, 0.18);
    a.add(t);
    const he = new THREE.Object3D();
    he.position.set(0, -LEN.ankleH, -0.06);
    a.add(he);
    hip[side] = h; knee[side] = kn; ankle[side] = a; toe[side] = t; heel[side] = he;

    const pivot = new THREE.Group();
    pivot.position.set(sx * shW, 0.46, 0);
    torso.add(pivot);
    const ar = new THREE.Group();
    pivot.add(ar);
    ell(ar, skin, [0.05, 0.05, 0.05], [0, 0, 0]);
    ell(ar, zoneMat.hombros, [0.064 * k, 0.078 * k, 0.066 * k], [0, -0.025, 0]);
    add(ar, upperGeo, skin);
    ell(ar, zoneMat.biceps, [0.038 * k, 0.12 * k, 0.04 * k], [0, -0.15, 0.028]);
    ell(ar, zoneMat.triceps, [0.04 * k, 0.12 * k, 0.04 * k], [0, -0.15, -0.03]);
    const e = new THREE.Group();
    e.position.y = -LEN.upper;
    ar.add(e);
    ell(e, skin, [0.034, 0.034, 0.034], [0, 0, 0]);
    add(e, foreGeo, skin);
    ell(e, zoneMat.antebrazos, [0.038 * k, 0.12 * k, 0.04 * k], [0, -0.105, 0]);
    const w = new THREE.Group();
    w.position.y = -LEN.fore;
    e.add(w);
    ell(w, skin, [0.036, 0.052, 0.022], [0, -0.04, 0]); // palma
    ell(w, skin, [0.013, 0.03, 0.013], [sx * -0.03, -0.03, 0.012]); // pulgar
    ell(w, skin, [0.03, 0.036, 0.016], [0, -0.1, 0.0]); // dedos
    const hm = new THREE.Object3D();
    hm.position.set(0, -0.06, 0);
    w.add(hm);
    sh[side] = pivot; arm[side] = ar; elbow[side] = e; hand[side] = hm;
  }

  const fig: Figure = {
    holder: root, root, torso, neck, hip, knee, ankle, sh, arm, elbow, hand, toe, heel, head,
    paint: (primary, secondary) => paintMaterials(zoneMat, primary, secondary),
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
  return fig;
}

function paintMaterials(zoneMat: Record<Zone, THREE.MeshPhysicalMaterial>, primary: Zone[], secondary: Zone[]) {
  for (const z of ZONES) {
    const m = zoneMat[z];
    const p = primary.includes(z);
    const s = secondary.includes(z);
    m.color.setHex(p ? PRIMARY : s ? SECONDARY : MUSCLE);
    m.emissive.setHex(p ? 0xff1018 : s ? 0xff7a00 : 0x000000);
    m.emissiveIntensity = p ? 0.28 : s ? 0.16 : 0;
  }
}

export const paintZones = (f: Figure, primary: Zone[], secondary: Zone[]) => f.paint(primary, secondary);

const v = (n: number | undefined, d = 0) => n ?? d;

/** Pone al maniquí en la postura indicada (sin mover la raíz: eso lo hace la escena). */
export function applyPose(f: Figure, P: Pose, flat: boolean, rootDeg = 0) {
  f.torso.rotation.set(v(P.hinge) * D, v(P.twist) * D, 0);
  f.neck.rotation.x = v(P.neck) * D;
  for (const side of ["L", "R"] as const) {
    const sx = side === "L" ? 1 : -1;
    const hipA = v(P[`hip${side}`], v(P.hip));
    const kneeA = v(P[`knee${side}`], v(P.knee));
    f.hip[side].rotation.set(-hipA * D, 0, sx * v(P.hipAbd) * D, "YXZ");
    f.knee[side].rotation.x = kneeA * D;
    const extra = v(P[`ankle${side}`], v(P.ankle));
    f.ankle[side].rotation.x = ((flat ? hipA - kneeA - rootDeg : 0) + extra) * D;

    const shA = v(P[`sh${side}`], v(P.sh));
    const abdA = v(P[`abd${side}`], v(P.abd));
    const horA = v(P[`hor${side}`], v(P.hor));
    f.arm[side].rotation.set(-shA * D, sx * horA * D, sx * abdA * D, "YXZ");
    f.elbow[side].rotation.x = -v(P[`el${side}`], v(P.el)) * D;
    f.sh[side].position.y = 0.46 + v(P.shrug);
  }
}

/** Puntos de apoyo con su "grosor" para que nada atraviese el suelo. */
export function contactPoints(f: Figure, mode: "feet" | "all"): number {
  f.root.updateMatrixWorld(true);
  const p = new THREE.Vector3();
  let min = Infinity;
  const take = (o: THREE.Object3D, r: number) => {
    o.getWorldPosition(p);
    min = Math.min(min, p.y - r);
  };
  for (const s of ["L", "R"] as const) {
    take(f.toe[s], 0);
    take(f.heel[s], 0);
    if (mode === "all") {
      take(f.knee[s], 0.05);
      take(f.hand[s], 0.04);
      take(f.elbow[s], 0.04);
      take(f.sh[s], 0.09);
    }
  }
  if (mode === "all") {
    take(f.root, 0.11);
    take(f.head, 0.11);
  }
  return min;
}

export function handsMidY(f: Figure): number {
  f.root.updateMatrixWorld(true);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  f.hand.L.getWorldPosition(a);
  f.hand.R.getWorldPosition(b);
  return (a.y + b.y) / 2;
}

export function handY(f: Figure): number {
  f.root.updateMatrixWorld(true);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  f.hand.L.getWorldPosition(a);
  f.hand.R.getWorldPosition(b);
  return Math.min(a.y, b.y) - 0.04;
}

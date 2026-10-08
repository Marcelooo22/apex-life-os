import * as THREE from "three";
import type { Zone } from "../exercises";
import type { Pose } from "./types";

const D = Math.PI / 180;
export const SKIN = 0xeef2f7;
export const MUSCLE = 0x8296b0;
export const PRIMARY = 0xef5350;
export const SECONDARY = 0xf5a524;

const LEN = { hipW: 0.095, thigh: 0.44, shin: 0.43, ankleH: 0.075, torso: 0.5, shW: 0.2, upper: 0.29, fore: 0.26 };
const ZONES: Zone[] = ["pecho", "hombros", "biceps", "triceps", "antebrazos", "abdomen", "oblicuos", "dorsales", "trapecio", "lumbar", "gluteos", "cuadriceps", "isquios", "gemelos"];

export interface Figure {
  root: THREE.Group;
  torso: THREE.Group;
  neck: THREE.Group;
  hip: Record<"L" | "R", THREE.Group>;
  knee: Record<"L" | "R", THREE.Group>;
  ankle: Record<"L" | "R", THREE.Group>;
  sh: Record<"L" | "R", THREE.Group>;
  arm: Record<"L" | "R", THREE.Group>;
  elbow: Record<"L" | "R", THREE.Group>;
  hand: Record<"L" | "R", THREE.Object3D>;
  toe: Record<"L" | "R", THREE.Object3D>;
  heel: Record<"L" | "R", THREE.Object3D>;
  head: THREE.Object3D;
  zoneMat: Record<Zone, THREE.MeshStandardMaterial>;
  dispose: () => void;
}

export function createFigure(): Figure {
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const sphere = new THREE.SphereGeometry(1, 22, 16);
  geos.push(sphere);
  const skin = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.8 });
  mats.push(skin);
  const zoneMat = {} as Record<Zone, THREE.MeshStandardMaterial>;
  for (const z of ZONES) {
    zoneMat[z] = new THREE.MeshStandardMaterial({ color: MUSCLE, roughness: 0.5 });
    mats.push(zoneMat[z]);
  }

  const ell = (parent: THREE.Object3D, mat: THREE.Material, s: [number, number, number], p: [number, number, number]) => {
    const m = new THREE.Mesh(sphere, mat);
    m.scale.set(...s);
    m.position.set(...p);
    parent.add(m);
    return m;
  };
  const caps = (parent: THREE.Object3D, len: number, r: number, mat: THREE.Material) => {
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 14);
    geos.push(g);
    const m = new THREE.Mesh(g, mat);
    m.position.y = -len / 2;
    parent.add(m);
    return m;
  };

  const root = new THREE.Group();
  ell(root, skin, [0.15, 0.1, 0.1], [0, -0.02, 0]);
  for (const sx of [1, -1]) ell(root, zoneMat.gluteos, [0.09, 0.1, 0.08], [sx * 0.085, -0.03, -0.065]);

  const torso = new THREE.Group();
  root.add(torso);
  ell(torso, skin, [0.165, 0.21, 0.1], [0, 0.33, 0]);
  ell(torso, skin, [0.13, 0.17, 0.085], [0, 0.12, 0]);
  for (const sx of [1, -1]) {
    ell(torso, zoneMat.pecho, [0.085, 0.07, 0.048], [sx * 0.085, 0.36, 0.075]);
    ell(torso, zoneMat.oblicuos, [0.04, 0.12, 0.07], [sx * 0.125, 0.18, 0.005]);
    ell(torso, zoneMat.dorsales, [0.09, 0.15, 0.045], [sx * 0.095, 0.3, -0.07]);
  }
  ell(torso, zoneMat.abdomen, [0.085, 0.13, 0.05], [0, 0.17, 0.072]);
  ell(torso, zoneMat.trapecio, [0.13, 0.075, 0.045], [0, 0.46, -0.05]);
  ell(torso, zoneMat.lumbar, [0.08, 0.075, 0.045], [0, 0.09, -0.07]);

  const neck = new THREE.Group();
  neck.position.set(0, 0.5, 0);
  torso.add(neck);
  const neckG = new THREE.CylinderGeometry(0.04, 0.045, 0.1, 14);
  geos.push(neckG);
  const nm = new THREE.Mesh(neckG, skin);
  nm.position.y = 0.04;
  neck.add(nm);
  const head = ell(neck, skin, [0.098, 0.115, 0.105], [0, 0.17, 0.01]);

  const hip = {} as Figure["hip"], knee = {} as Figure["knee"], ankle = {} as Figure["ankle"];
  const sh = {} as Figure["sh"], arm = {} as Figure["arm"], elbow = {} as Figure["elbow"];
  const hand = {} as Figure["hand"], toe = {} as Figure["toe"], heel = {} as Figure["heel"];

  for (const side of ["L", "R"] as const) {
    const sx = side === "L" ? 1 : -1;
    // pierna
    const h = new THREE.Group();
    h.position.set(sx * LEN.hipW, -0.02, 0);
    root.add(h);
    caps(h, LEN.thigh, 0.058, skin);
    ell(h, zoneMat.cuadriceps, [0.068, 0.2, 0.062], [0, -0.21, 0.035]);
    ell(h, zoneMat.isquios, [0.062, 0.19, 0.055], [0, -0.21, -0.042]);
    const k = new THREE.Group();
    k.position.y = -LEN.thigh;
    h.add(k);
    caps(k, LEN.shin, 0.043, skin);
    ell(k, zoneMat.gemelos, [0.05, 0.14, 0.05], [0, -0.13, -0.03]);
    const a = new THREE.Group();
    a.position.y = -LEN.shin;
    k.add(a);
    const footG = new THREE.BoxGeometry(0.09, 0.06, 0.25);
    geos.push(footG);
    const foot = new THREE.Mesh(footG, skin);
    foot.position.set(0, -0.045, 0.06);
    a.add(foot);
    const t = new THREE.Object3D();
    t.position.set(0, -LEN.ankleH, 0.18);
    a.add(t);
    const he = new THREE.Object3D();
    he.position.set(0, -LEN.ankleH, -0.06);
    a.add(he);
    hip[side] = h; knee[side] = k; ankle[side] = a; toe[side] = t; heel[side] = he;

    // brazo
    const pivot = new THREE.Group();
    pivot.position.set(sx * LEN.shW, 0.46, 0);
    torso.add(pivot);
    const ar = new THREE.Group();
    pivot.add(ar);
    ell(ar, zoneMat.hombros, [0.065, 0.075, 0.065], [0, -0.02, 0]);
    caps(ar, LEN.upper, 0.036, skin);
    ell(ar, zoneMat.biceps, [0.04, 0.12, 0.04], [0, -0.15, 0.03]);
    ell(ar, zoneMat.triceps, [0.04, 0.12, 0.04], [0, -0.15, -0.03]);
    const e = new THREE.Group();
    e.position.y = -LEN.upper;
    ar.add(e);
    caps(e, LEN.fore, 0.03, skin);
    ell(e, zoneMat.antebrazos, [0.04, 0.12, 0.04], [0, -0.11, 0]);
    const w = new THREE.Group();
    w.position.y = -LEN.fore;
    e.add(w);
    ell(w, skin, [0.04, 0.055, 0.025], [0, -0.04, 0]);
    const hm = new THREE.Object3D();
    hm.position.set(0, -0.05, 0);
    w.add(hm);
    sh[side] = pivot; arm[side] = ar; elbow[side] = e; hand[side] = hm;
  }

  return {
    root, torso, neck, hip, knee, ankle, sh, arm, elbow, hand, toe, heel, head, zoneMat,
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

/** Colorea las zonas: las principales en rojo, las secundarias en ámbar y el resto en azul grisáceo. */
export function paintZones(f: Figure, primary: Zone[], secondary: Zone[]) {
  for (const z of ZONES) f.zoneMat[z].color.setHex(primary.includes(z) ? PRIMARY : secondary.includes(z) ? SECONDARY : MUSCLE);
}

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

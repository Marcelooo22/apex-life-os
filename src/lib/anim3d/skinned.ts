import * as THREE from "three";
import type { Zone } from "../exercises";
import type { BodyData, BodyPart } from "./body-data";
import { BODY, BONE_LEN as LEN, PRIMARY, SECONDARY, type BodySex, type Figure } from "./figure";

const SKIN_TONE = 0xc98f6a;

function geometryOf(data: BodyData, part: BodyPart): { geo: THREE.BufferGeometry; zones: Uint8Array; strength: Uint8Array } {
  const { meta, buf } = data;
  const n = part.count;
  const q = new Int16Array(buf, part.pos, n * 3);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) pos[i * 3 + a] = (q[i * 3 + a]! / 32767) * meta.ext[a]! + meta.ctr[a]!;
  const nq = new Int8Array(buf, part.nor, n * 4);
  const nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const x = nq[i * 4]!, y = nq[i * 4 + 1]!, z = nq[i * 4 + 2]!;
    const l = Math.hypot(x, y, z) || 1;
    nor.set([x / l, y / l, z / l], i * 3);
  }
  const si = new Uint16Array(n * 4);
  si.set(new Uint8Array(buf, part.sidx, n * 4));
  const sw = new Float32Array(n * 4);
  const swq = new Uint8Array(buf, part.sw, n * 4);
  for (let i = 0; i < n * 4; i++) sw[i] = swq[i]! / 255;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geo.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
  geo.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
  geo.setIndex(new THREE.BufferAttribute(new Uint16Array(buf.slice(part.idx, part.idx + part.tris * 6)), 1));
  return { geo, zones: new Uint8Array(buf.slice(part.zone, part.zone + n)), strength: new Uint8Array(buf.slice(part.zstr, part.zstr + n)) };
}

/** Cuerpo de una sola pieza con esqueleto: los mismos huesos y medidas que el maniquí de piezas. */
export function createSkinnedFigure(sex: BodySex, data: BodyData): Figure {
  const { hipW, shW } = BODY[sex];
  const F = sex === "female";
  const bone = (name: string, x = 0, y = 0, z = 0) => {
    const b = new THREE.Bone();
    b.name = name;
    b.position.set(x, y, z);
    return b;
  };
  const root = bone("root");
  const torso = bone("torso");
  root.add(torso);
  const neck = bone("neck", 0, 0.5, 0);
  torso.add(neck);
  const hip = {} as Figure["hip"], knee = {} as Figure["knee"], ankle = {} as Figure["ankle"];
  const sh = {} as Figure["sh"], arm = {} as Figure["arm"], elbow = {} as Figure["elbow"];
  const wrist = {} as Record<"L" | "R", THREE.Bone>;
  const hand = {} as Figure["hand"], toe = {} as Figure["toe"], heel = {} as Figure["heel"];
  for (const s of ["L", "R"] as const) {
    const sx = s === "L" ? 1 : -1;
    hip[s] = bone("hip" + s, sx * hipW, -0.02, 0);
    root.add(hip[s]);
    knee[s] = bone("knee" + s, 0, -LEN.thigh, 0);
    hip[s].add(knee[s]);
    ankle[s] = bone("ankle" + s, 0, -LEN.shin, 0);
    knee[s].add(ankle[s]);
    toe[s] = new THREE.Object3D();
    toe[s].position.set(0, -LEN.ankleH, 0.18);
    ankle[s].add(toe[s]);
    heel[s] = new THREE.Object3D();
    heel[s].position.set(0, -LEN.ankleH, -0.06);
    ankle[s].add(heel[s]);
    sh[s] = new THREE.Object3D();
    sh[s].position.set(sx * shW, 0.46, 0);
    torso.add(sh[s]);
    arm[s] = bone("arm" + s);
    sh[s].add(arm[s]);
    elbow[s] = bone("elbow" + s, 0, -LEN.upper, 0);
    arm[s].add(elbow[s]);
    wrist[s] = bone("wrist" + s, 0, -LEN.fore, 0);
    elbow[s].add(wrist[s]);
    hand[s] = new THREE.Object3D();
    hand[s].position.set(0, -0.06, 0);
    wrist[s].add(hand[s]);
  }
  const head = new THREE.Object3D();
  head.position.set(0, 0.185, 0.01);
  neck.add(head);

  // El orden debe ser el del generador (scripts/gen-body.mjs).
  const byName: Record<string, THREE.Bone> = { root, torso, neck: neck, hipL: hip.L as THREE.Bone, kneeL: knee.L as THREE.Bone, ankleL: ankle.L as THREE.Bone, hipR: hip.R as THREE.Bone, kneeR: knee.R as THREE.Bone, ankleR: ankle.R as THREE.Bone, armL: arm.L as THREE.Bone, elbowL: elbow.L as THREE.Bone, wristL: wrist.L, armR: arm.R as THREE.Bone, elbowR: elbow.R as THREE.Bone, wristR: wrist.R };
  const bones = data.meta.bones.map((n) => byName[n]!);
  // La malla está esculpida con los brazos separados: así se calcula el "reposo" del esqueleto y luego se vuelven a bajar.
  const rest = (data.meta.armAngle * Math.PI) / 180;
  arm.L.rotation.z = rest;
  arm.R.rotation.z = -rest;
  root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  arm.L.rotation.z = 0;
  arm.R.rotation.z = 0;
  root.updateMatrixWorld(true);

  const holder = new THREE.Group();
  holder.add(root);
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const sphere = new THREE.SphereGeometry(1, 20, 14);
  geos.push(sphere);

  const skinPart = data.meta.parts.find((p) => p.name === "skin")!;
  const { geo: skinGeo, zones, strength } = geometryOf(data, skinPart);
  geos.push(skinGeo);
  const colors = new Float32Array(skinPart.count * 3);
  skinGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const skinMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.12, clearcoatRoughness: 0.5, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xff9d8a) });
  mats.push(skinMat);
  const skin = new THREE.SkinnedMesh(skinGeo, skinMat);
  skin.frustumCulled = false;
  skin.castShadow = true;
  holder.add(skin);
  skin.bind(skeleton, new THREE.Matrix4());

  const cloth = (name: BodyPart["name"], color: number, rough: number) => {
    const part = data.meta.parts.find((p) => p.name === name);
    if (!part) return;
    const { geo } = geometryOf(data, part);
    geos.push(geo);
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
    mats.push(m);
    const mesh = new THREE.SkinnedMesh(geo, m);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    holder.add(mesh);
    mesh.bind(skeleton, new THREE.Matrix4());
  };
  cloth("shorts", 0x1b2027, 0.9);
  cloth("hair", F ? 0x2a1a12 : 0x16110d, 0.75);
  if (F) cloth("top", 0x0f8f86, 0.7);

  // Detalles rígidos: zapatillas, pelo y cara
  const rigid = (parent: THREE.Object3D, color: number, s: [number, number, number], p: [number, number, number], rough = 0.6) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
    mats.push(m);
    const mesh = new THREE.Mesh(sphere, m);
    mesh.scale.set(...s);
    mesh.position.set(...p);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  for (const s of ["L", "R"] as const) {
    rigid(ankle[s], 0x15181d, [0.052, 0.04, 0.135], [0, -0.045, 0.058]);
    rigid(ankle[s], 0x15181d, [0.05, 0.055, 0.05], [0, -0.02, -0.03]);
    rigid(ankle[s], 0xeceff4, [0.056, 0.014, 0.145], [0, -0.071, 0.057], 0.5);
  }
  const hair = F ? 0x2a1a12 : 0x16110d;
  for (const sx of [1, -1]) {
    rigid(neck, 0xf3f1ee, [0.0155, 0.0105, 0.007], [sx * 0.034, 0.205, 0.107], 0.3);
    rigid(neck, 0x251a14, [0.0085, 0.0085, 0.005], [sx * 0.034, 0.205, 0.113], 0.3);
    const b = rigid(neck, hair, [0.028, 0.0062, 0.011], [sx * 0.036, 0.228, 0.103], 0.8);
    b.rotation.z = sx * -0.14;
  }
  rigid(neck, 0x6b2f2a, [0.017, 0.0035, 0.006], [0, 0.145, 0.108], 0.5);

  const base = new THREE.Color(SKIN_TONE);
  const red = new THREE.Color(PRIMARY);
  const amber = new THREE.Color(SECONDARY);
  const names = data.meta.zones;
  const paint = (primary: Zone[], secondary: Zone[]) => {
    for (let i = 0; i < skinPart.count; i++) {
      const name = names[zones[i]!] as Zone | "";
      const c = name && primary.includes(name as Zone) ? red : name && secondary.includes(name as Zone) ? amber : base;
      const k = c === base ? 0 : strength[i]! / 255;
      colors[i * 3] = base.r + (c.r - base.r) * k;
      colors[i * 3 + 1] = base.g + (c.g - base.g) * k;
      colors[i * 3 + 2] = base.b + (c.b - base.b) * k;
    }
    (skinGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
  };
  paint([], []);

  return {
    holder, root, torso, neck, hip, knee, ankle, sh, arm, elbow, hand, toe, heel, head, paint,
    dispose: () => {
      skeleton.dispose();
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

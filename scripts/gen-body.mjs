/**
 * Genera el cuerpo 3D de Apex (hombre y mujer) a partir de formas implícitas (esferas y cápsulas fusionadas),
 * lo convierte en malla con "marching cubes" y calcula el peso de cada hueso y la zona muscular de cada vértice.
 * Uso:  node scripts/gen-body.mjs male|female
 * Salida: public/models/body-<sexo>.bin + .json  (se cargan en el visor 3D)
 */
import fs from "node:fs";
import { edgeTable, triTable } from "three/examples/jsm/objects/MarchingCubes.js";

const SEX = process.argv[2] === "female" ? "female" : "male";
const F = SEX === "female";
const STEP = Number(process.argv[3] ?? 0.009);

/* ------------------------------ zonas ------------------------------ */
const ZONES = ["", "pecho", "hombros", "biceps", "triceps", "antebrazos", "abdomen", "oblicuos", "dorsales", "trapecio", "lumbar", "gluteos", "cuadriceps", "isquios", "gemelos"];
const Z = Object.fromEntries(ZONES.map((n, i) => [n, i]));

/* ------------------------------ primitivas ------------------------------ */
const prims = [];
const E = (c, r, zone = "", k = 0.03, rz = 0) => prims.push({ t: 0, c, r, z: Z[zone], k, rz });
const C = (a, b, ra, rb, zone = "", k = 0.03) => prims.push({ t: 1, a, b, ra, rb, z: Z[zone], k });
/** Añade la forma y su espejo (x → −x). */
const E2 = (c, r, zone, k, rz = 0) => { E(c, r, zone, k, rz); E([-c[0], c[1], c[2]], r, zone, k, -rz); };
const C2 = (a, b, ra, rb, zone, k) => { C(a, b, ra, rb, zone, k); C([-a[0], a[1], a[2]], [-b[0], b[1], b[2]], ra, rb, zone, k); };

const m = F ? 0.9 : 1.14; // músculos algo más finos (ella) o más marcados (él)
const shW = F ? 0.183 : 0.2;
const hipW = F ? 0.1 : 0.095;

// pelvis, glúteos, tronco
E([0, -0.035, 0], [F ? 0.16 : 0.148, 0.105, F ? 0.108 : 0.105], "", 0.05);
E2([F ? 0.09 : 0.085, -0.055, -0.075], [F ? 0.1 : 0.09, F ? 0.11 : 0.1, F ? 0.095 : 0.085], "gluteos", 0.04);
E([0, 0.1, 0], [F ? 0.108 : 0.116, 0.11, 0.085], "", 0.06);
E([0, 0.22, 0], [F ? 0.125 : 0.142, 0.12, 0.095], "", 0.06);
E([0, 0.34, 0], [F ? 0.145 : 0.178, 0.14, F ? 0.1 : 0.108], "", 0.06);
E([0, 0.43, -0.005], [F ? 0.165 : 0.205, 0.078, 0.095], "", 0.05);
E2([F ? 0.075 : 0.088, 0.355, F ? 0.05 : 0.058], [F ? 0.07 : 0.09, F ? 0.06 : 0.076, F ? 0.045 : 0.058], "pecho", 0.025);
if (F) E2([0.07, 0.325, 0.082], [0.057, 0.052, 0.06], "pecho", 0.03);
for (const y of F ? [0.27, 0.22, 0.17] : [0.285, 0.235, 0.185, 0.135]) E2([0.034, y, F ? 0.062 : 0.071], [F ? 0.028 : 0.033, F ? 0.018 : 0.022, F ? 0.022 : 0.03], "abdomen", 0.012);
E2([F ? 0.105 : 0.118, 0.18, 0.01], [0.04 * m, 0.115 * m, 0.075], "oblicuos", 0.03);
E2([F ? 0.09 : 0.11, 0.3, -0.07], [0.09 * m, 0.14 * m, 0.052], "dorsales", 0.03);
E([0, 0.28, -0.085], [0.1 * m, 0.16 * m, 0.04], "dorsales", 0.03);
E([0, 0.465, -0.04], [0.115 * m, 0.07 * m, 0.06], "trapecio", 0.04);
C2([0, 0.5, -0.01], [F ? 0.14 : 0.16, 0.472, -0.005], 0.04 * m, 0.035 * m, "trapecio", 0.04);
E([0, 0.08, -0.08], [0.075 * m, 0.08 * m, 0.045], "lumbar", 0.03);
// cuello y cabeza
C([0, 0.5, 0], [0, 0.585, 0.012], 0.046, 0.042, "", 0.04);
E([0, 0.69, 0.012], [0.088, 0.112, 0.1], "", 0.03);
E([0, 0.635, 0.045], [0.064, 0.058, 0.066], "", 0.03);
E([0, 0.668, 0.108], [0.013, 0.022, 0.02], "", 0.012);
E2([0.088, 0.685, 0], [0.012, 0.03, 0.02], "", 0.01);
E([0, 0.708, 0.092], [0.066, 0.012, 0.025], "", 0.015);
// brazos (esculpidos en "A", separados del cuerpo; el esqueleto los vuelve a bajar)
const ARM = (28 * Math.PI) / 180;
const mm = F ? 0.9 : 1.22;
const pivot = (side) => [side * shW, 0.46, 0];
/** Punto a distancia `d` del hombro siguiendo el brazo, con un desplazamiento lateral `lx` y hacia delante `lz`. */
const armAt = (side, d, lx = 0, lz = 0) => {
  const [px, py] = pivot(side);
  return [px + side * Math.sin(ARM) * d + side * Math.cos(ARM) * lx, py - Math.cos(ARM) * d + Math.sin(ARM) * lx, lz];
};
for (const side of [1, -1]) {
  const rz = side * ARM;
  E(armAt(side, 0.0, 0.005), [0.068 * mm, 0.082 * mm, 0.07 * mm], "hombros", 0.03, rz);
  C(pivot(side), armAt(side, 0.29), F ? 0.04 : 0.047, F ? 0.032 : 0.038, "", 0.03);
  E(armAt(side, 0.145, 0, 0.027), [0.036 * mm, 0.1, 0.04 * mm], "biceps", 0.02, rz);
  E(armAt(side, 0.13, 0, -0.03), [0.04 * mm, 0.105, 0.04 * mm], "triceps", 0.02, rz);
  E(armAt(side, 0.29), [0.04, 0.04, 0.04], "", 0.02, rz);
  C(armAt(side, 0.29), armAt(side, 0.55), F ? 0.034 : 0.04, F ? 0.023 : 0.027, "", 0.03);
  E(armAt(side, 0.39, 0, 0.005), [0.042 * mm, 0.1, 0.042 * mm], "antebrazos", 0.02, rz);
  E(armAt(side, 0.615), [0.03, 0.065, 0.024], "", 0.02, rz);
  E(armAt(side, 0.665), [0.026, 0.04, 0.018], "", 0.02, rz);
  E(armAt(side, 0.61, -0.028, 0.012), [0.012, 0.03, 0.012], "", 0.015, rz);
}
// piernas
C2([hipW, -0.02, 0], [hipW, -0.46, 0], F ? 0.08 : 0.075, F ? 0.05 : 0.05, "", 0.04);
E2([hipW, -0.25, 0.032], [0.07 * m, 0.2, 0.066 * m], "cuadriceps", 0.03);
E2([hipW, -0.26, -0.042], [0.064 * m, 0.19, 0.056 * m], "isquios", 0.03);
E2([hipW - 0.03, -0.2, 0], [0.04, 0.16, 0.05], "", 0.03);
E2([hipW, -0.46, 0.012], [0.05, 0.05, 0.05], "", 0.02);
C2([hipW, -0.46, 0], [hipW, -0.885, 0], 0.047, 0.03, "", 0.03);
E2([hipW, -0.6, -0.03], [0.053 * m, 0.14, 0.06 * m], "gemelos", 0.03);
E2([hipW, -0.62, 0.028], [0.03, 0.17, 0.03], "", 0.02);
E2([hipW, -0.885, 0], [0.034, 0.04, 0.034], "", 0.02);
E2([hipW, -0.93, 0.065], [0.045, 0.032, 0.115], "", 0.02);
E2([hipW, -0.92, -0.03], [0.04, 0.04, 0.045], "", 0.02);

/* ------------------------------ campos de distancia ------------------------------ */
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
function dist(p, x, y, z) {
  if (p.t === 0) {
    let lx = x - p.c[0], ly = y - p.c[1];
    if (p.rz) { const c = Math.cos(p.rz), sn = Math.sin(p.rz); const t = lx * c + ly * sn; ly = -lx * sn + ly * c; lx = t; }
    const dx = lx / p.r[0], dy = ly / p.r[1], dz = (z - p.c[2]) / p.r[2];
    const k0 = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const k1 = Math.sqrt((dx / p.r[0]) ** 2 + (dy / p.r[1]) ** 2 + (dz / p.r[2]) ** 2);
    return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(...p.r);
  }
  const ax = p.a[0], ay = p.a[1], az = p.a[2];
  const bx = p.b[0] - ax, by = p.b[1] - ay, bz = p.b[2] - az;
  const px = x - ax, py = y - ay, pz = z - az;
  const t = Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  const dx = px - bx * t, dy = py - by * t, dz = pz - bz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (p.ra + (p.rb - p.ra) * t);
}
function body(x, y, z) {
  let d = 1e9;
  for (const p of prims) d = smin(d, dist(p, x, y, z), p.k);
  return d;
}
/** Zona muscular de un punto de la superficie: la forma "con zona" más cercana, si casi toca la superficie. */
function zoneAt(x, y, z, dBody) {
  let best = 1e9, zone = 0;
  for (const p of prims) {
    if (!p.z) continue;
    const d = dist(p, x, y, z);
    if (d < best) { best = d; zone = p.z; }
  }
  const t = Math.min(1, Math.max(0, 1 - (best - dBody - 0.002) / 0.012)); // 1 dentro del músculo, 0 a 1,4 cm
  const strength = t * t * (3 - 2 * t);
  return strength > 0.02 ? [zone, Math.round(strength * 255)] : [0, 0];
}

// Ropa: short suelto (hombre y mujer) y top deportivo (mujer)
const R = 0.108;
const shortsParts = [
  { t: 0, c: [0, -0.035, 0], r: [F ? 0.168 : 0.158, 0.115, 0.115], k: 0.04 },
  { t: 1, a: [hipW, -0.02, 0], b: [hipW, -0.3, 0], ra: R + 0.004, rb: R - 0.006, k: 0.04 },
  { t: 1, a: [-hipW, -0.02, 0], b: [-hipW, -0.3, 0], ra: R + 0.004, rb: R - 0.006, k: 0.04 },
];
// Los bordes del short se alinean con la malla para que el corte salga recto y no dentado.
const SH_LO = -0.34, SH_STEP = 0.0065;
const onGrid = (y) => SH_LO + Math.round((y - SH_LO) / SH_STEP) * SH_STEP + 0.0001;
const HEM_TOP = onGrid(0.058), HEM_BOTTOM = onGrid(-0.285);
function shorts(x, y, z) {
  let d = 1e9;
  for (const p of shortsParts) d = smin(d, dist(p, x, y, z), p.k);
  const shell = Math.abs(d + 0.008) - 0.008; // tela de ~1,6 cm, hueca por dentro
  return Math.max(shell, y - HEM_TOP, HEM_BOTTOM - y);
}
const topParts = [
  { t: 0, c: [0, 0.34, 0], r: [0.158, 0.14, 0.108], k: 0.04 },
  { t: 0, c: [0.07, 0.325, 0.082], r: [0.066, 0.058, 0.067], k: 0.03 },
  { t: 0, c: [-0.07, 0.325, 0.082], r: [0.066, 0.058, 0.067], k: 0.03 },
];
function top(x, y, z) {
  let d = 1e9;
  for (const p of topParts) d = smin(d, dist(p, x, y, z), p.k);
  return Math.max(d, y - 0.4, 0.27 - y);
}

// Pelo: una cáscara que cubre cráneo, laterales y nuca, y deja libre la cara.
const headExp = (x, y, z) => {
  const p = { t: 0, c: [0, 0.69, 0.012], r: [0.088 + 0.014, 0.112 + 0.016, 0.1 + 0.014] };
  return dist(p, x, y, z);
};
function hair(x, y, z) {
  let d = headExp(x, y, z);
  if (F) {
    d = smin(d, dist({ t: 0, c: [0, 0.745, -0.115], r: [0.042, 0.05, 0.042] }, x, y, z), 0.03);
    d = smin(d, dist({ t: 0, c: [0, 0.66, -0.14], r: [0.032, 0.11, 0.03] }, x, y, z), 0.03);
  } else {
    d = smin(d, dist({ t: 0, c: [0, 0.785, 0.045], r: [0.052, 0.034, 0.062] }, x, y, z), 0.025);
  }
  const hairline = 0.752 - 0.55 * (0.112 - z); // más alta delante, baja por los lados y la nuca
  return Math.max(d, hairline - y);
}

/* ------------------------------ esqueleto (reposo) ------------------------------ */
const bones = ["root", "torso", "neck", "hipL", "kneeL", "ankleL", "hipR", "kneeR", "ankleR", "armL", "elbowL", "wristL", "armR", "elbowR", "wristR"];
const B = Object.fromEntries(bones.map((n, i) => [n, i]));
const seg = (bone, a, b) => ({ bone: B[bone], a, b });
const segs = [
  seg("root", [-0.12, -0.03, 0], [0.12, -0.03, 0]), seg("root", [0, -0.06, 0], [0, 0.03, 0]),
  seg("torso", [0, 0.03, 0], [0, 0.48, 0]),
  ...[0.07, 0.15, 0.25, 0.35].map((y) => seg("torso", [-0.14, y, 0], [0.14, y, 0])),
  seg("torso", [-0.17, 0.47, 0], [0.17, 0.47, 0]),
  seg("neck", [0, 0.5, 0], [0, 0.8, 0]),
];
for (const [s, side] of [["L", 1], ["R", -1]]) {
  segs.push(seg("hip" + s, [side * hipW, -0.03, 0], [side * hipW, -0.46, 0]));
  segs.push(seg("knee" + s, [side * hipW, -0.46, 0], [side * hipW, -0.885, 0]));
  segs.push(seg("ankle" + s, [side * hipW, -0.885, 0], [side * hipW, -0.96, 0.19]));
  segs.push(seg("arm" + s, pivot(side), armAt(side, 0.29)));
  segs.push(seg("elbow" + s, armAt(side, 0.29), armAt(side, 0.55)));
  segs.push(seg("wrist" + s, armAt(side, 0.55), armAt(side, 0.68)));
}
function segDist(s, x, y, z) {
  const bx = s.b[0] - s.a[0], by = s.b[1] - s.a[1], bz = s.b[2] - s.a[2];
  const px = x - s.a[0], py = y - s.a[1], pz = z - s.a[2];
  const l = bx * bx + by * by + bz * bz;
  const t = l > 0 ? Math.min(1, Math.max(0, (px * bx + py * by + pz * bz) / l)) : 0;
  return Math.hypot(px - bx * t, py - by * t, pz - bz * t);
}
const TAU = 0.013;
function weights(x, y, z) {
  const d = new Float64Array(bones.length).fill(1e9);
  for (const s of segs) d[s.bone] = Math.min(d[s.bone], segDist(s, x, y, z));
  const min = Math.min(...d);
  const w = [...d].map((v, i) => [i, Math.exp(-(v - min) / TAU)]).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const sum = w.reduce((s, [, v]) => s + v, 0);
  const q = w.map(([i, v]) => [i, Math.round((v / sum) * 255)]);
  q[0][1] += 255 - q.reduce((s, [, v]) => s + v, 0);
  while (q.length < 4) q.push([0, 0]);
  return q;
}

/* ------------------------------ marching cubes ------------------------------ */
const BOUNDS = { min: [-0.62, -1.0, -0.17], max: [0.62, 0.88, 0.215] };
function mesh(field, region, withZones, step = STEP, rigid = undefined) {
  const STEP_ = step;
  const lo = region?.min ?? BOUNDS.min, hi = region?.max ?? BOUNDS.max;
  const n = [0, 1, 2].map((a) => Math.ceil((hi[a] - lo[a]) / STEP_) + 1);
  const [nx, ny, nz] = n;
  const vals = new Float32Array(nx * ny * nz);
  const at = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[at(i, j, k)] = field(lo[0] + i * STEP_, lo[1] + j * STEP_, lo[2] + k * STEP_);
  const corner = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
  const edgeV = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const verts = [], map = new Map(), tris = [];
  const grad = (x, y, z) => { const e = 0.002; const gx = field(x + e, y, z) - field(x - e, y, z), gy = field(x, y + e, z) - field(x, y - e, z), gz = field(x, y, z + e) - field(x, y, z - e); const l = Math.hypot(gx, gy, gz) || 1; return [gx / l, gy / l, gz / l]; };
  const vertexOnEdge = (i, j, k, e) => {
    const [a, b] = edgeV[e];
    const ia = at(i + corner[a][0], j + corner[a][1], k + corner[a][2]), ib = at(i + corner[b][0], j + corner[b][1], k + corner[b][2]);
    const key = ia < ib ? ia * 4294967 + ib : ib * 4294967 + ia;
    let id = map.get(key);
    if (id !== undefined) return id;
    const va = vals[ia], vb = vals[ib];
    const t = va / (va - vb);
    const pa = [lo[0] + (i + corner[a][0]) * STEP_, lo[1] + (j + corner[a][1]) * STEP_, lo[2] + (k + corner[a][2]) * STEP_];
    const pb = [lo[0] + (i + corner[b][0]) * STEP_, lo[1] + (j + corner[b][1]) * STEP_, lo[2] + (k + corner[b][2]) * STEP_];
    const x = pa[0] + (pb[0] - pa[0]) * t, y = pa[1] + (pb[1] - pa[1]) * t, z = pa[2] + (pb[2] - pa[2]) * t;
    id = verts.length;
    verts.push({ x, y, z });
    map.set(key, id);
    return id;
  };
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let idx = 0;
    for (let c = 0; c < 8; c++) if (vals[at(i + corner[c][0], j + corner[c][1], k + corner[c][2])] < 0) idx |= 1 << c;
    if (!edgeTable[idx]) continue;
    const ev = [];
    for (let e = 0; e < 12; e++) if (edgeTable[idx] & (1 << e)) ev[e] = vertexOnEdge(i, j, k, e);
    for (let t = 0; triTable[idx * 16 + t] !== -1; t += 3) tris.push([ev[triTable[idx * 16 + t]], ev[triTable[idx * 16 + t + 1]], ev[triTable[idx * 16 + t + 2]]]);
  }
  // atributos
  const out = { count: verts.length, pos: [], nor: [], sidx: [], sw: [], zone: [], zstr: [], idx: [] };
  for (const v of verts) {
    const g = grad(v.x, v.y, v.z);
    out.pos.push(v.x, v.y, v.z);
    out.nor.push(...g);
    const w = rigid !== undefined ? [[rigid, 255], [0, 0], [0, 0], [0, 0]] : weights(v.x, v.y, v.z);
    out.sidx.push(...w.map((q) => q[0]));
    out.sw.push(...w.map((q) => q[1]));
    const [zn, zs] = withZones ? zoneAt(v.x, v.y, v.z, field(v.x, v.y, v.z)) : [0, 0];
    out.zone.push(zn);
    out.zstr.push(zs);
  }
  // orientación: el triángulo debe mirar hacia fuera (donde crece la distancia)
  for (const [a, b, c] of tris) {
    const A = verts[a], Bv = verts[b], Cv = verts[c];
    const ux = Bv.x - A.x, uy = Bv.y - A.y, uz = Bv.z - A.z, vx = Cv.x - A.x, vy = Cv.y - A.y, vz = Cv.z - A.z;
    const nxn = uy * vz - uz * vy, nyn = uz * vx - ux * vz, nzn = ux * vy - uy * vx;
    const gi = out.nor.slice(a * 3, a * 3 + 3);
    const flip = nxn * gi[0] + nyn * gi[1] + nzn * gi[2] < 0;
    out.idx.push(a, flip ? c : b, flip ? b : c);
  }
  return out;
}

/* ------------------------------ escritura binaria ------------------------------ */
const pad4 = (n) => (4 - (n % 4)) % 4;
const chunks = [];
let offset = 0;
const push = (typed) => {
  const buf = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
  const o = offset;
  chunks.push(buf);
  offset += buf.length;
  const p = pad4(buf.length);
  if (p) { chunks.push(Buffer.alloc(p)); offset += p; }
  return o;
};
const ctr = [0, 1, 2].map((a) => (BOUNDS.min[a] + BOUNDS.max[a]) / 2);
const ext = [0, 1, 2].map((a) => (BOUNDS.max[a] - BOUNDS.min[a]) / 2);

function write(name, geo) {
  const q = new Int16Array(geo.count * 3);
  for (let i = 0; i < geo.count; i++) for (let a = 0; a < 3; a++) q[i * 3 + a] = Math.max(-32767, Math.min(32767, Math.round(((geo.pos[i * 3 + a] - ctr[a]) / ext[a]) * 32767)));
  const nor = new Int8Array(geo.count * 4);
  for (let i = 0; i < geo.count; i++) for (let a = 0; a < 3; a++) nor[i * 4 + a] = Math.max(-127, Math.min(127, Math.round(geo.nor[i * 3 + a] * 127)));
  const part = {
    name, count: geo.count, tris: geo.idx.length / 3,
    pos: push(q), nor: push(nor), sidx: push(Uint8Array.from(geo.sidx)), sw: push(Uint8Array.from(geo.sw)), zone: push(Uint8Array.from(geo.zone)), zstr: push(Uint8Array.from(geo.zstr)),
    idx: push(Uint16Array.from(geo.idx)),
  };
  return part;
}

const t0 = Date.now();
console.log(`[${SEX}] paso ${STEP} m …`);
const skin = mesh(body, null, true);
console.log(`  piel: ${skin.count} vértices, ${skin.idx.length / 3} triángulos (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
const parts = [write("skin", skin)];
const sh = mesh(shorts, { min: [-0.3, -0.34, -0.17], max: [0.3, 0.1, 0.17] }, false, 0.0065);
console.log(`  short: ${sh.count} vértices`);
parts.push(write("shorts", sh));
const hr = mesh(hair, { min: [-0.12, 0.58, -0.2], max: [0.12, 0.84, 0.14] }, false, 0.005, B.neck);
console.log(`  pelo: ${hr.count} vértices`);
parts.push(write("hair", hr));
if (F) {
  const tp = mesh(top, { min: [-0.26, 0.25, -0.15], max: [0.26, 0.42, 0.17] }, false);
  console.log(`  top: ${tp.count} vértices`);
  parts.push(write("top", tp));
}
const meta = { sex: SEX, step: STEP, armAngle: 28, ctr, ext, bones, zones: ZONES, parts, bytes: offset };
fs.writeFileSync(`public/models/body-${SEX}.bin`, Buffer.concat(chunks));
fs.writeFileSync(`public/models/body-${SEX}.json`, JSON.stringify(meta));
console.log(`  listo: ${(offset / 1024).toFixed(0)} KB en ${((Date.now() - t0) / 1000).toFixed(1)} s`);

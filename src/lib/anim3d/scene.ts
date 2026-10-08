import * as THREE from "three";
import type { Zone } from "../exercises";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clampPose } from "./limits";
import { loadBody, type BodyData } from "./body-data";
import { createSkinnedFigure } from "./skinned";
import { applyPose, contactPoints, solveArm, createFigure, handsMidY, handY, paintZones, type BodySex, type Figure } from "./figure";
import type { HandsOut, Motion, Pose, Prop, V3 } from "./types";

const D = Math.PI / 180;
const METAL = 0xa7b3c6;
const PLATE = 0x252c37;
const FURN = 0x3b4556;

const lerpPose = (a: Pose, b: Pose, s: number): Pose => {
  const out: Pose = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Pose>) {
    const x = a[k] ?? 0;
    const y = b[k] ?? 0;
    out[k] = x + (y - x) * s;
  }
  return out;
};

/** 0→1→0 con pausa suave en los extremos. */
export function cycleShape(p: number, hold = false): number {
  const tri = 1 - Math.abs(2 * (p % 1) - 1);
  const x = Math.min(1, Math.max(0, (tri - 0.1) / 0.8));
  const eased = x * x * (3 - 2 * x);
  return hold ? eased * 0.5 : eased;
}

/** Escena 3D de un ejercicio: maniquí, material y cámara. */
export class ExerciseScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  private fig: Figure;
  private propsRoot = new THREE.Group();
  private updaters: (() => void)[] = [];
  private motion: Motion | null = null;
  private disposables: { dispose(): void }[] = [];
  private target = new THREE.Vector3(0, 0.9, 0);
  private dist = 5;
  az = 40;
  el = 10;

  private sex: BodySex = "male";
  private skinned = false;
  private disposed = false;
  private lastS = 0;
  private lastMiss = 0;
  private bodies: Partial<Record<BodySex, BodyData>> = {};
  private loading = new Set<BodySex>();
  private zones: { primary: Zone[]; secondary: Zone[] } = { primary: [], secondary: [] };

  constructor(canvas: HTMLCanvasElement, opts: { preserve?: boolean } = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power", preserveDrawingBuffer: !!opts.preserve });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // Reflejos de estudio: es lo que da brillo y volumen a los materiales.
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = env.texture;
    this.scene.environmentIntensity = 0.5;
    this.disposables.push(env);
    pmrem.dispose();

    this.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2030, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.9);
    key.position.set(2.6, 4.2, 3.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const cam = key.shadow.camera;
    cam.left = -2.4; cam.right = 2.4; cam.top = 2.4; cam.bottom = -2.4; cam.near = 0.5; cam.far = 14;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 3;
    const rim = new THREE.DirectionalLight(0x7fb0ff, 1.7);
    rim.position.set(-3, 2.6, -3.2);
    const fill = new THREE.DirectionalLight(0xffe2c2, 0.55);
    fill.position.set(-2.4, 1.6, 3);
    this.scene.add(key, rim, fill);

    this.fig = createFigure(this.sex);
    this.fig.holder.visible = false; // se muestra el cuerpo con piel en cuanto llega (o este, si no se pudo cargar)
    this.scene.add(this.fig.holder, this.propsRoot);

    // Suelo: sombra real bajo el maniquí y un halo suave.
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShadowMaterial({ opacity: 0.6 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.receiveShadow = true;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), new THREE.MeshBasicMaterial({ map: this.glowTexture(), transparent: true, depthWrite: false }));
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.0015;
    shadow.position.y = 0.002;
    this.scene.add(glow, shadow);
    this.disposables.push(shadow.geometry, shadow.material as THREE.Material, glow.geometry, glow.material as THREE.Material);
  }

  private glowTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, "rgba(150,185,255,.22)");
    grad.addColorStop(0.6, "rgba(120,150,210,.08)");
    grad.addColorStop(1, "rgba(120,150,210,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    this.disposables.push(t);
    return t;
  }

  /** Descarga el cuerpo con piel por adelantado (para que esté listo al abrir el visor). */
  async preload(sex: BodySex) {
    if (this.bodies[sex]) return;
    this.bodies[sex] = await loadBody(sex);
  }

  /** Pone el cuerpo (hombre o mujer): con piel si ya está descargado; si no, un maniquí de piezas oculto mientras llega. */
  private swapFigure(sex: BodySex) {
    const data = this.bodies[sex];
    if (!data) this.fetchBody(sex);
    if (sex === this.sex && this.skinned === !!data) return;
    this.sex = sex;
    this.skinned = !!data;
    this.clearProps();
    this.scene.remove(this.fig.holder);
    this.fig.dispose();
    this.fig = data ? createSkinnedFigure(sex, data) : createFigure(sex);
    this.scene.add(this.fig.holder);
    if (!data) this.fig.holder.visible = false;
  }

  private fetchBody(sex: BodySex) {
    if (this.loading.has(sex)) return;
    this.loading.add(sex);
    loadBody(sex)
      .then((d) => {
        this.bodies[sex] = d;
        this.loading.delete(sex);
        if (this.disposed || this.sex !== sex || !this.motion) return;
        const az = this.az;
        this.setMotion(this.motion, this.zones.primary, this.zones.secondary, sex);
        this.az = az;
        this.renderAt(this.lastS);
      })
      .catch((err) => {
        console.warn("Cuerpo 3D: se usa el maniquí de piezas", err);
        this.loading.delete(sex);
        if (!this.disposed && this.sex === sex) {
          this.fig.holder.visible = true; // sin el archivo, se queda el maniquí de piezas
          if (this.motion) this.renderAt(this.lastS);
        }
      });
  }

  private size = { w: 0, h: 0, dpr: 1 };
  private low = false;

  /** Calidad reducida para dispositivos lentos: sin sombras y a resolución normal. */
  setLowQuality(low: boolean) {
    if (low === this.low) return;
    this.low = low;
    this.renderer.shadowMap.enabled = !low;
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      const list = Array.isArray(m) ? m : m ? [m] : [];
      for (const x of list) {
        if ((x as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) (x as THREE.MeshPhysicalMaterial).clearcoat = low ? 0 : 0.3;
        x.needsUpdate = true;
      }
    });
    if (this.size.w) this.setSize(this.size.w, this.size.h, this.size.dpr);
  }

  get isLow() {
    return this.low;
  }

  setSize(w: number, h: number, dpr: number) {
    this.size = { w, h, dpr };
    this.renderer.setPixelRatio(this.low ? 1 : Math.min(dpr, 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.fit();
  }

  /* ---------- movimiento ---------- */
  setMotion(m: Motion, primary: Zone[], secondary: Zone[], sex: BodySex = this.sex) {
    this.swapFigure(sex);
    this.motion = m;
    this.zones = { primary, secondary };
    paintZones(this.fig, primary, secondary);
    this.buildProps(m.props ?? []);
    this.az = m.view ?? 40;
    this.fit();
  }

  /** Pone el cuerpo en la postura `raw` (limitada a rangos humanos) y coloca las manos si el movimiento las guía. */
  private place(m: Motion, raw: Pose, s: number) {
    this.placeBody(m, clampPose(raw).pose);
    if (m.raise) this.fig.root.position.y += m.raise;
    this.lastMiss = this.applyHands(m, s);
  }

  private applyHands(m: Motion, s: number): number {
    if (!m.hands) return 0;
    const f = this.fig;
    f.root.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    const arr = (w: THREE.Vector3): V3 => [w.x, w.y, w.z];
    const out: HandsOut = m.hands(s, {
      t: (x, y, z) => arr(f.torso.localToWorld(v.set(x, y, z))),
      dir: (x, y, z) => arr(v.set(x, y, z).transformDirection(f.torso.matrixWorld)),
      sh: { L: arr(f.sh.L.getWorldPosition(new THREE.Vector3())), R: arr(f.sh.R.getWorldPosition(new THREE.Vector3())) },
    });
    let miss = 0;
    for (const side of ["L", "R"] as const) {
      const pole = out[side === "L" ? "poleL" : "poleR"] ?? [side === "L" ? 0.5 : -0.5, -1, -0.3];
      miss = Math.max(miss, solveArm(f, side, new THREE.Vector3(...out[side]), new THREE.Vector3(...pole)));
    }
    f.root.updateMatrixWorld(true);
    return miss;
  }

  private placeBody(m: Motion, P: Pose) {
    const f = this.fig;
    const rootDeg = (m.rootX ?? 0) - (P.lift ?? 0);
    const flat = m.flat !== false;
    const setRoot = (deg: number) => {
      f.root.rotation.set(deg * D, 0, 0);
      f.root.position.set(0, 0, 0);
    };
    const sole = (side: "L" | "R") => {
      f.root.updateMatrixWorld(true);
      const p = new THREE.Vector3();
      let min = Infinity;
      for (const o of [f.toe[side], f.heel[side]]) {
        o.getWorldPosition(p);
        min = Math.min(min, p.y);
      }
      return min;
    };

    if (m.ground === "plank") {
      applyPose(f, P, flat, rootDeg);
      let best = rootDeg, bestErr = Infinity;
      for (let d = rootDeg; d >= rootDeg - 40; d -= 1) {
        setRoot(d);
        applyPose(f, P, flat, d);
        f.root.position.y = -contactPoints(f, "feet");
        const err = Math.abs(handY(f));
        if (err < bestErr) { bestErr = err; best = d; }
      }
      setRoot(best);
      applyPose(f, P, flat, best);
      f.root.position.y = -contactPoints(f, "feet");
      return;
    }

    if (m.plant) {
      const other = m.plant === "R" ? "L" : "R";
      const key = `knee${m.plant}` as "kneeL" | "kneeR";
      let bestK = P[key] ?? P.knee ?? 0, bestErr = Infinity;
      for (let k = 0; k <= 170; k += 2) {
        const Q = { ...P, [key]: k };
        setRoot(rootDeg);
        applyPose(f, Q, flat, rootDeg);
        f.root.position.y = -sole(other);
        const err = Math.abs(sole(m.plant));
        if (err < bestErr) { bestErr = err; bestK = k; }
      }
      const Q = { ...P, [key]: bestK };
      setRoot(rootDeg);
      applyPose(f, Q, flat, rootDeg);
      f.root.position.y = -sole(other);
      return;
    }

    setRoot(rootDeg);
    applyPose(f, P, flat, rootDeg);
    if (m.ground === "hands") {
      f.root.position.y = (m.barY ?? 2.1) - handsMidY(f);
    } else {
      f.root.position.y = -contactPoints(f, m.ground === "all" ? "all" : "feet");
    }
  }

  /** Para la auditoría: mide un instante del movimiento sin dibujar. */
  audit(s: number) {
    const m = this.motion;
    if (!m) return null;
    const raw = lerpPose(m.a, m.b, s);
    const { hits } = clampPose(raw);
    const reach = (() => { this.place(m, raw, s); return this.lastMiss; })();
    const f = this.fig;
    f.root.updateMatrixWorld(true);
    const v = new THREE.Vector3();
    const y = (o: THREE.Object3D) => o.getWorldPosition(v).y;
    const soles = (["L", "R"] as const).map((k) => Math.min(y(f.toe[k]), y(f.heel[k])));
    const low = Math.min(y(f.hand.L), y(f.hand.R), y(f.elbow.L), y(f.elbow.R), y(f.knee.L), y(f.knee.R), y(f.head));
    // ¿manos o codos dentro del tronco o de la cabeza? (se mide en coordenadas del tronco)
    let inside = 0;
    const lp = new THREE.Vector3();
    for (const o of [f.hand.L, f.hand.R, f.elbow.L, f.elbow.R]) {
      o.getWorldPosition(lp);
      f.torso.worldToLocal(lp);
      if (lp.y > 0.02 && lp.y < 0.5 && (lp.x / 0.15) ** 2 + (lp.z / 0.1) ** 2 < 1) inside++;
      if (lp.y > 0.52 && lp.distanceTo(new THREE.Vector3(0, 0.68, 0.01)) < 0.1) inside++;
    }
    return { hits, soles, low, pelvisY: y(f.root), reach, inside };
  }

  /** Dibuja el fotograma de la fase `s` (0 = postura A, 1 = postura B). */
  renderAt(s: number) {
    const m = this.motion;
    if (!m) return;
    this.lastS = s;
    this.place(m, lerpPose(m.a, m.b, s), s);
    this.fig.root.updateMatrixWorld(true);
    this.updaters.forEach((u) => u());
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  /** Dibuja el instante `t` (segundos) del ciclo continuo. */
  frame(t: number, seconds = 3.6) {
    const m = this.motion;
    if (!m) return;
    this.renderAt(cycleShape(t / seconds, m.hold));
  }

  /* ---------- cámara ---------- */
  /** Encuadra todo el recorrido del movimiento (incluida la barra) con un margen. */
  private fit() {
    const m = this.motion;
    if (!m || this.camera.aspect === 0) return;
    const box = new THREE.Box3();
    for (const s of [0, 0.25, 0.5, 0.75, 1]) {
      this.place(m, lerpPose(m.a, m.b, s), s);
      this.fig.root.updateMatrixWorld(true);
      this.updaters.forEach((u) => u());
      box.union(new THREE.Box3().setFromObject(this.fig.holder, true));
      this.propsRoot.children.forEach((c) => {
        if (!c.userData.noFit && c.visible) box.union(new THREE.Box3().setFromObject(c));
      });
    }
    box.getCenter(this.target);
    const corners = [0, 1].flatMap((x) => [0, 1].flatMap((y) => [0, 1].map((z) => new THREE.Vector3(x ? box.max.x : box.min.x, y ? box.max.y : box.min.y, z ? box.max.z : box.min.z))));
    const tanV = Math.tan((this.camera.fov * D) / 2);
    const tanH = tanV * this.camera.aspect;
    this.dist = 6;
    for (let i = 0; i < 4; i++) {
      this.updateCamera();
      this.camera.updateMatrixWorld(true);
      const inv = this.camera.matrixWorldInverse;
      let need = 0;
      for (const c of corners) {
        const v = c.clone().applyMatrix4(inv);
        const depth = Math.max(0.1, -v.z);
        need = Math.max(need, Math.abs(v.x) / (depth * tanH), Math.abs(v.y) / (depth * tanV));
      }
      this.dist = Math.max(1.5, (this.dist * need) / 0.95);
    }
  }

  private updateCamera() {
    const az = this.az * D, el = this.el * D;
    this.camera.position.set(
      this.target.x + this.dist * Math.sin(az) * Math.cos(el),
      this.target.y + this.dist * Math.sin(el),
      this.target.z + this.dist * Math.cos(az) * Math.cos(el),
    );
    this.camera.lookAt(this.target);
  }

  /* ---------- material ---------- */
  private clearProps() {
    this.propsRoot.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    this.propsRoot.clear();
    this.fig.hand.L.clear();
    this.fig.hand.R.clear();
    this.updaters = [];
  }

  private buildProps(props: Prop[]) {
    this.clearProps();
    const R = this.propsRoot;
    const mat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, metalness: 0.55 });
    const metal = mat(METAL), plate = mat(PLATE), furn = mat(FURN);
    this.disposables.push(metal, plate, furn);
    const cyl = (r: number, h: number, m: THREE.Material) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), m);
    const box = (x: number, y: number, z: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(x, y, z), m);
    const f = this.fig;
    const wp = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());
    const rod = (m: THREE.Material) => { const r = cyl(0.007, 1, m); r.userData.noFit = true; R.add(r); return r; };
    const stretch = (r: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) => {
      const d = b.clone().sub(a);
      r.position.copy(a).addScaledVector(d, 0.5);
      r.scale.set(1, d.length(), 1);
      r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    };
    const barbell = () => {
      const g = new THREE.Group();
      const bar = cyl(0.014, 1.55, metal);
      bar.rotation.z = Math.PI / 2;
      g.add(bar);
      for (const x of [-0.6, -0.64, 0.6, 0.64]) {
        const p = cyl(0.15, 0.028, plate);
        p.rotation.z = Math.PI / 2;
        p.position.x = x;
        g.add(p);
      }
      R.add(g);
      return g;
    };

    for (const p of props) {
      if (p.t === "bar") {
        const g = barbell();
        const local = p.on === "back" ? new THREE.Vector3(0, 0.45, -0.1) : new THREE.Vector3(0, 0.43, 0.11);
        this.updaters.push(() => {
          if (p.on === "hands") g.position.copy(wp(f.hand.L)).add(wp(f.hand.R)).multiplyScalar(0.5);
          else {
            g.position.copy(f.torso.localToWorld(local.clone()));
            f.torso.getWorldQuaternion(g.quaternion);
          }
        });
      } else if (p.t === "db") {
        for (const s of ["L", "R"] as const) {
          const g = new THREE.Group();
          const bar = cyl(0.012, 0.2, metal);
          bar.rotation.z = Math.PI / 2;
          g.add(bar);
          for (const x of [-0.095, 0.095]) {
            const pl = cyl(0.065, 0.045, plate);
            pl.rotation.z = Math.PI / 2;
            pl.position.x = x;
            g.add(pl);
          }
          f.hand[s].add(g);
        }
      } else if (p.t === "cable") {
        const anchor = new THREE.Vector3(...p.anchor);
        const rods: [THREE.Mesh, "L" | "R" | "M"][] = [];
        const targets = p.to === "left" ? ["L"] : p.to === "right" ? ["R"] : ["L", "R"];
        for (const t of targets as ("L" | "R")[]) rods.push([rod(mat(0x7b8596)), t]);
        const a1 = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), metal);
        a1.position.copy(anchor);
        a1.userData.noFit = true;
        R.add(a1);
        const col = box(0.09, anchor.y + 0.08, 0.09, furn);
        col.position.set(anchor.x, (anchor.y + 0.08) / 2, anchor.z);
        const base = box(0.45, 0.05, 0.45, furn);
        base.position.set(anchor.x, 0.025, anchor.z);
        col.userData.noFit = base.userData.noFit = true;
        R.add(col, base);
        this.updaters.push(() => rods.forEach(([r, t]) => stretch(r, anchor, wp(f.hand[t as "L" | "R"]))));
      } else if (p.t === "pullbar") {
        const b = cyl(0.016, 1.3, metal);
        b.rotation.z = Math.PI / 2;
        b.position.set(0, p.y, 0);
        R.add(b);
        for (const x of [-0.65, 0.65]) {
          const post = cyl(0.02, p.y + 0.1, metal);
          post.position.set(x, (p.y + 0.1) / 2 - 0.05, -0.05);
          R.add(post);
        }
      } else if (p.t === "dipbars") {
        for (const x of [-0.27, 0.27]) {
          const b = cyl(0.016, 0.8, metal);
          b.rotation.x = Math.PI / 2;
          b.position.set(x, p.y, 0);
          R.add(b);
          for (const z of [-0.36, 0.36]) {
            const post = cyl(0.02, p.y, metal);
            post.position.set(x, p.y / 2, z);
            R.add(post);
          }
        }
      } else if (p.t === "bench" || (p.t === "seat" && p.back)) {
        const pad = box(0.34, 0.9, 0.07, furn);
        const post = box(0.05, 1, 0.05, furn);
        const seat = p.t === "seat" ? box(0.42, 0.07, 0.42, furn) : null;
        R.add(pad, post);
        if (seat) R.add(seat);
        this.updaters.push(() => {
          const q = f.torso.getWorldQuaternion(new THREE.Quaternion());
          pad.quaternion.copy(q);
          pad.position.copy(f.torso.localToWorld(new THREE.Vector3(0, 0.22, this.motion && (this.motion.rootX ?? 0) > 0 ? 0.125 : -0.125)));
          const top = Math.max(0.05, pad.position.y - 0.04);
          post.scale.y = top;
          post.position.set(pad.position.x, top / 2, pad.position.z);
          if (seat) seat.position.copy(wp(f.root)).add(new THREE.Vector3(0, -0.14, 0));
        });
      } else if (p.t === "seat") {
        const seat = box(0.42, 0.07, 0.42, furn);
        const post = box(0.05, 1, 0.05, furn);
        R.add(seat, post);
        this.updaters.push(() => {
          seat.position.copy(wp(f.root)).add(new THREE.Vector3(0, -0.14, -0.02));
          post.scale.y = Math.max(0.05, seat.position.y);
          post.position.set(seat.position.x, post.scale.y / 2, seat.position.z);
        });
      } else if (p.t === "pad") {
        const pad = box(0.34, 0.34, 0.06, furn);
        const post = box(0.05, 1, 0.05, furn);
        R.add(pad, post);
        this.updaters.push(() => {
          const q = f.torso.getWorldQuaternion(new THREE.Quaternion());
          pad.position.copy(f.torso.localToWorld(new THREE.Vector3(0, 0.2, 0.22)));
          pad.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.6));
          post.scale.y = pad.position.y;
          post.position.set(0, pad.position.y / 2, pad.position.z + 0.04);
        });
      } else if (p.t === "handbench") {
        const b = box(0.6, 0.08, 0.42, furn);
        const post = box(0.05, 1, 0.05, furn);
        R.add(b, post);
        this.updaters.push(() => {
          const h = wp(f.hand.L).add(wp(f.hand.R)).multiplyScalar(0.5);
          b.position.set(0, h.y - 0.1, h.z);
          post.scale.y = Math.max(0.05, h.y - 0.14);
          post.position.set(0, post.scale.y / 2, h.z);
        });
      } else if (p.t === "machine") {
        const padM = mat(0x23262e);
        padM.metalness = 0.05;
        padM.roughness = 0.85;
        const acc = mat(0x4a1d22);
        this.disposables.push(padM, acc);
        const V = THREE.Vector3;
        const tl = (x: number, y: number, z: number) => f.torso.localToWorld(new V(x, y, z));
        const tag = <T extends THREE.Object3D>(o: T) => {
          o.userData.noFit = true;
          R.add(o);
          return o;
        };
        const bx = (w: number, h: number, d: number, m: THREE.Material) => tag(box(w, h, d, m));
        const cy = (r: number, h: number, m: THREE.Material) => tag(cyl(r, h, m));
        const rotZ = new THREE.Quaternion().setFromAxisAngle(new V(0, 0, 1), Math.PI / 2);
        const tq = () => f.torso.getWorldQuaternion(new THREE.Quaternion());
        const mid = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().add(b).multiplyScalar(0.5);
        const o0 = () => wp(f.root);
        const k = p.kind;
        if (k === "chest" || k === "shoulder") {
          const col = bx(0.5, 1.6, 0.1, metal);
          const stack = bx(0.34, 0.8, 0.2, acc);
          const hi = k === "shoulder" ? 0.62 : 0.45;
          const grips = (["L", "R"] as const).map((s) => ({ s, grip: cy(0.02, 0.15, metal), lever: cy(0.02, 1, metal) }));
          this.updaters.push(() => {
            const o = o0();
            col.position.set(o.x, 0.8, o.z - 0.36);
            stack.position.set(o.x, 0.5, o.z - 0.52);
            for (const { s, grip, lever } of grips) {
              const h = wp(f.hand[s]);
              grip.position.copy(h);
              grip.quaternion.copy(tq()).multiply(rotZ);
              stretch(lever as THREE.Mesh, h, new V(...tl((s === "L" ? 1 : -1) * 0.36, hi, -0.3).toArray()));
            }
          });
        } else if (k === "pecdeck") {
          const house = bx(0.7, 1.0, 0.16, metal);
          const arms = (["L", "R"] as const).map((s) => ({ s, pad: cy(0.05, 1, padM), lever: cy(0.02, 1, metal) }));
          this.updaters.push(() => {
            const o = o0();
            house.position.set(o.x, 0.6, o.z - 0.4);
            for (const { s, pad, lever } of arms) {
              const e = wp(f.elbow[s]);
              const w = wp(f.hand[s]);
              stretch(pad as THREE.Mesh, e, w);
              stretch(lever as THREE.Mesh, e, tl((s === "L" ? 1 : -1) * 0.3, 0.4, -0.28));
            }
          });
        } else if (k === "lat") {
          const posts = [-0.7, 0.7].map(() => bx(0.08, 2.65, 0.08, metal));
          const beam = bx(1.5, 0.08, 0.1, metal);
          const bar = cy(0.018, 1, metal);
          const wires = [cy(0.006, 1, metal), cy(0.006, 1, metal)];
          const thigh = bx(0.46, 0.07, 0.22, padM);
          const stack = bx(0.4, 1.2, 0.3, acc);
          this.updaters.push(() => {
            const o = o0();
            posts[0]!.position.set(-0.7, 1.32, o.z + 0.2);
            posts[1]!.position.set(0.7, 1.32, o.z + 0.2);
            beam.position.set(0, 2.62, o.z + 0.2);
            stack.position.set(0, 0.6, o.z + 0.55);
            const L = wp(f.hand.L), Rr = wp(f.hand.R);
            const dir = L.clone().sub(Rr).normalize();
            const eL = L.clone().addScaledVector(dir, 0.2), eR = Rr.clone().addScaledVector(dir, -0.2);
            stretch(bar as THREE.Mesh, eL, eR);
            stretch(wires[0] as THREE.Mesh, new V(0.5, 2.55, o.z + 0.2), eL);
            stretch(wires[1] as THREE.Mesh, new V(-0.5, 2.55, o.z + 0.2), eR);
            const kn = mid(wp(f.knee.L), wp(f.knee.R));
            thigh.position.set(kn.x, kn.y + 0.12, kn.z - 0.04);
          });
        } else if (k === "row") {
          const plate = bx(0.55, 0.36, 0.05, metal);
          const stack = bx(0.5, 1.5, 0.35, acc);
          const grips = (["L", "R"] as const).map((s) => ({ s, grip: cy(0.018, 0.16, metal) }));
          this.updaters.push(() => {
            const t = mid(wp(f.toe.L), wp(f.toe.R));
            plate.position.set(t.x, t.y + 0.13, t.z + 0.08);
            plate.rotation.x = -0.35;
            stack.position.set(0, 0.75, o0().z + 2.2);
            for (const { s, grip } of grips) {
              grip.position.copy(wp(f.hand[s]));
              grip.quaternion.copy(tq()).multiply(rotZ);
            }
          });
        } else if (k === "legext" || k === "legcurl" || k === "legcurlLying") {
          const pad = cy(0.045, 0.34, padM);
          const levers = [cy(0.02, 1, metal), cy(0.02, 1, metal)];
          const thigh = k === "legcurlLying" ? null : bx(0.4, 0.07, 0.2, padM);
          this.updaters.push(() => {
            const a = mid(wp(f.ankle.L), wp(f.ankle.R));
            const off = k === "legcurlLying" ? new V(0, 0.07, 0) : new V(0, 0.05, 0.05);
            pad.position.copy(a).add(off);
            pad.quaternion.copy(rotZ);
            const o = o0();
            [0.26, -0.26].forEach((x, i) => stretch(levers[i] as THREE.Mesh, new V(pad.position.x + x * 0.6, pad.position.y, pad.position.z), new V(x, o.y - 0.14, o.z + (k === "legcurlLying" ? 0.5 : 0.05))));
            if (thigh) {
              const kn = mid(wp(f.knee.L), wp(f.knee.R));
              thigh.position.set(kn.x, kn.y + (k === "legext" ? 0.13 : 0.12), kn.z - 0.12);
            }
          });
        } else if (k === "legpress") {
          const plate = bx(0.85, 0.6, 0.05, metal);
          plate.userData.noFit = false;
          const rails = [bx(0.05, 0.05, 1, metal), bx(0.05, 0.05, 1, metal)];
          const weights = [-1, 1].map(() => {
            const w = cy(0.22, 0.07, plate.material as THREE.Material);
            w.userData.noFit = false;
            return w;
          });
          this.updaters.push(() => {
            const t = mid(wp(f.toe.L), wp(f.toe.R));
            const o = o0();
            const n = t.clone().sub(o).normalize();
            const c = t.clone().addScaledVector(n, 0.06);
            plate.position.copy(c);
            plate.quaternion.setFromUnitVectors(new V(0, 0, 1), n);
            rails.forEach((r, i) => {
              const x = i ? -0.34 : 0.34;
              stretch(r as THREE.Mesh, new V(x, o.y - 0.15, o.z - 0.1), c.clone().addScaledVector(n, 0.5).add(new V(x, 0, 0)));
              (r as THREE.Mesh).scale.x = (r as THREE.Mesh).scale.z = 1;
            });
            weights.forEach((w, i) => {
              w.position.copy(c).addScaledVector(n, 0.12).add(new V(i ? -0.5 : 0.5, 0, 0));
              w.quaternion.copy(rotZ);
            });
          });
        } else if (k === "abductor") {
          const pads = (["L", "R"] as const).map((s) => ({ s, pad: bx(0.08, 0.22, 0.1, padM), lever: cy(0.02, 1, metal) }));
          this.updaters.push(() => {
            const o = o0();
            for (const { s, pad, lever } of pads) {
              const x = s === "L" ? 1 : -1;
              const kn = wp(f.knee[s]);
              pad.position.set(kn.x + x * 0.11, kn.y, kn.z);
              stretch(lever as THREE.Mesh, pad.position, new V(x * 0.34, o.y - 0.1, o.z - 0.12));
            }
          });
        } else if (k === "hack") {
          const rails = [-0.36, 0.36].map(() => cy(0.03, 1, metal));
          const back = bx(0.42, 0.95, 0.08, padM);
          const shp = bx(0.42, 0.1, 0.14, padM);
          const foot = bx(0.8, 0.04, 0.5, metal);
          this.updaters.push(() => {
            const o = o0();
            rails.forEach((r, i) => stretch(r as THREE.Mesh, new V(i ? 0.36 : -0.36, 0, o.z + 0.55), new V(i ? 0.36 : -0.36, 1.85, o.z - 0.3)));
            const q = tq();
            back.quaternion.copy(q);
            back.position.copy(tl(0, 0.3, -0.13));
            const s = mid(wp(f.sh.L), wp(f.sh.R));
            shp.position.set(s.x, s.y + 0.08, s.z + 0.0);
            foot.position.set(0, 0.02, o.z + 0.2);
            foot.rotation.x = -0.35;
          });
        }
      } else if (p.t === "stepbox") {
        const b = box(0.45, 1, 0.4, furn);
        R.add(b);
        this.updaters.push(() => {
          const h = Math.max(0.01, wp(f.heel.L).y);
          b.visible = h > 0.06;
          b.scale.y = h;
          b.position.set(wp(f.toe.L).x, h / 2, wp(f.toe.L).z - 0.05);
        });
      } else if (p.t === "wheel") {
        const w = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 10, 24), plate);
        w.rotation.y = Math.PI / 2;
        R.add(w);
        this.updaters.push(() => w.position.copy(wp(f.hand.L)).add(wp(f.hand.R)).multiplyScalar(0.5));
      }
    }
    this.shadowAll();
  }

  private shadowAll() {
    this.propsRoot.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
    for (const s of ["L", "R"] as const) this.fig.hand[s].traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true;
    });
  }

  dispose() {
    this.disposed = true;
    this.clearProps();
    this.scene.environment = null;
    this.fig.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

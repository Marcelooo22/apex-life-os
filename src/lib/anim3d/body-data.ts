/** Carga del cuerpo 3D precalculado (public/models/body-<sexo>.bin y .json, generado con scripts/gen-body.mjs). */
export interface BodyPart {
  name: "skin" | "shorts" | "top" | "hair";
  count: number;
  tris: number;
  pos: number;
  nor: number;
  sidx: number;
  sw: number;
  zone: number;
  /** Intensidad (0-255) con la que cada vértice se tiñe de su zona muscular. */
  zstr: number;
  idx: number;
}
export interface BodyMeta {
  sex: "male" | "female";
  /** Grados de separación de los brazos en la postura de la malla. */
  armAngle: number;
  ctr: number[];
  ext: number[];
  bones: string[];
  zones: string[];
  parts: BodyPart[];
}
export interface BodyData {
  meta: BodyMeta;
  buf: ArrayBuffer;
}

const cache = new Map<string, Promise<BodyData>>();

export function loadBody(sex: "male" | "female"): Promise<BodyData> {
  let p = cache.get(sex);
  if (!p) {
    p = (async () => {
      const [metaRes, binRes] = await Promise.all([fetch(`/models/body-${sex}.json`), fetch(`/models/body-${sex}.bin`)]);
      if (!metaRes.ok || !binRes.ok) throw new Error("No se pudo cargar el cuerpo 3D");
      return { meta: (await metaRes.json()) as BodyMeta, buf: await binRes.arrayBuffer() };
    })();
    cache.set(sex, p);
    p.catch(() => cache.delete(sex));
  }
  return p;
}

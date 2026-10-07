import { STORAGE_KEY } from "../constants";
import { defaults, hydrate } from "../defaults";
import { getState, replaceState, subscribe } from "../store";
import type { AppState } from "../types";
import { supabase } from "./client";

/**
 * Sincronización con la cuenta.
 * - Lo local manda: se guarda siempre en el dispositivo y, con sesión, se envía a la nube unos segundos después.
 * - Antes de sobrescribir nada con datos de la nube se guarda una copia local de seguridad.
 * - Si el dispositivo y la nube tienen datos distintos al iniciar sesión, se le pregunta a la persona.
 */
export type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "error" | "offline";
export type Choice = "cloud" | "device";
export interface ConflictInfo {
  cloudAt: string;
}

interface Meta {
  uid: string;
  /** updated_at de la nube que conocemos. */
  remote: string | null;
  dirty: boolean;
}

const META_KEY = "apex.sync";
const PUSH_DELAY = 2500;
const MAX_BYTES = 4_000_000;

let uid: string | null = null;
let meta: Meta | null = null;
let applying = false;
let status = "idle" as SyncStatus;
let lastOk = null as number | null;
let timer: ReturnType<typeof setTimeout> | undefined;
let unsubscribe: (() => void) | null = null;
let resolver: ((info: ConflictInfo) => Promise<Choice>) | null = null;
let pushing: Promise<void> | null = null;
const listeners = new Set<() => void>();
let snapshot: { status: SyncStatus; lastOk: number | null } = { status, lastOk };

const emit = () => {
  snapshot = { status, lastOk };
  listeners.forEach((l) => l());
};
const set = (s: SyncStatus) => {
  status = s;
  if (s === "synced") lastOk = Date.now();
  emit();
};

export const subscribeSync = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getSyncSnapshot = () => snapshot;

const readMeta = (): Meta | null => {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "null") as Meta | null;
  } catch {
    return null;
  }
};
const writeMeta = () => {
  try {
    if (meta) localStorage.setItem(META_KEY, JSON.stringify(meta));
    else localStorage.removeItem(META_KEY);
  } catch {
    /* sin espacio */
  }
};

/** ¿Hay algo hecho por la persona (no solo los datos de ejemplo)? */
export function hasUserData(s: AppState): boolean {
  const habitLogs = s.habits.list.some((h) => Object.keys(h.log).length > 0);
  const songs = s.hobbies.instruments.some((i) => i.songs.some((x) => x.id !== "s1"));
  const food = Object.values(s.nutrition.days).some((d) => d.meals.length > 0 || d.water > 0);
  return s.gym.sessions.length > 0 || Object.keys(s.gym.marks).length > 0 || s.gym.body.length > 0 || habitLogs || songs || food || s.uni.tasks.length > 0 || s.uni.subjects.length > 0 || s.custom.length > 0 || s.habits.list.length > 5;
}

function backupLocal() {
  try {
    localStorage.setItem(`apex.backup.${Date.now()}`, JSON.stringify(getState()));
    const old = Object.keys(localStorage).filter((k) => k.startsWith("apex.backup.")).sort();
    old.slice(0, Math.max(0, old.length - 2)).forEach((k) => localStorage.removeItem(k));
  } catch {
    /* sin espacio */
  }
}

function applyRemote(data: unknown, updatedAt: string) {
  backupLocal();
  applying = true;
  try {
    replaceState(hydrate(data));
  } finally {
    applying = false;
  }
  if (meta) {
    meta.remote = updatedAt;
    meta.dirty = false;
    writeMeta();
  }
}

async function fetchRow(): Promise<{ data: unknown; updated_at: string } | null> {
  const { data, error } = await supabase().from("apex_state").select("data,updated_at").eq("user_id", uid!).limit(1);
  if (error) throw error;
  return (data?.[0] as { data: unknown; updated_at: string } | undefined) ?? null;
}

async function resolveConflict(row: { data: unknown; updated_at: string }) {
  const choice = resolver ? await resolver({ cloudAt: row.updated_at }) : "cloud";
  if (choice === "cloud") {
    applyRemote(row.data, row.updated_at);
    set("synced");
  } else {
    meta!.remote = row.updated_at;
    meta!.dirty = true;
    writeMeta();
    await push(true);
  }
}

/** Envía el estado local a la nube. `force` sobrescribe aunque la nube haya cambiado. */
async function push(force = false): Promise<void> {
  if (!uid || !meta || (!meta.dirty && !force)) return;
  if (pushing) return pushing;
  pushing = (async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return set("offline");
    const snap = getState();
    const body = JSON.stringify(snap);
    if (body.length > MAX_BYTES) return set("error");
    set("syncing");
    const stamp = new Date().toISOString();
    try {
      const db = supabase().from("apex_state");
      if (!meta!.remote) {
        const { error } = await db.insert({ user_id: uid, data: snap, updated_at: stamp });
        if (error?.code === "23505") {
          const row = await fetchRow();
          if (row) return await resolveConflict(row);
        } else if (error) throw error;
      } else {
        let q = db.update({ data: snap, updated_at: stamp }).eq("user_id", uid);
        if (!force) q = q.eq("updated_at", meta!.remote);
        const { data, error } = await q.select("updated_at");
        if (error) throw error;
        if (!data?.length) {
          const row = await fetchRow();
          if (row) return await resolveConflict(row);
          meta!.remote = null; // la fila desapareció: se vuelve a crear
          meta!.dirty = true;
          return await push(true);
        }
      }
      meta!.remote = stamp;
      meta!.dirty = getState() !== snap;
      writeMeta();
      set(meta!.dirty ? "pending" : "synced");
      if (meta!.dirty) schedule();
    } catch {
      set("error");
    }
  })().finally(() => {
    pushing = null;
  });
  return pushing;
}

const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(() => void push(), PUSH_DELAY);
};

/** Empieza a sincronizar con la cuenta `userId`. Devuelve cuando termina la primera comparación. */
export async function startSync(userId: string, onConflict: (info: ConflictInfo) => Promise<Choice>): Promise<void> {
  stopSync();
  uid = userId;
  resolver = onConflict;
  const prev = readMeta();
  meta = prev?.uid === userId ? prev : { uid: userId, remote: null, dirty: false };
  writeMeta();
  unsubscribe = subscribe(() => {
    if (applying || !meta) return;
    meta.dirty = true;
    writeMeta();
    set("pending");
    schedule();
  });
  set("syncing");
  try {
    const row = await fetchRow();
    const local = getState();
    if (!row) {
      meta.dirty = true;
      await push(true);
    } else if (meta.remote === row.updated_at && !meta.dirty) {
      set("synced");
    } else if (meta.remote && !meta.dirty) {
      applyRemote(row.data, row.updated_at); // otro dispositivo guardó algo más nuevo
      set("synced");
    } else if (!hasUserData(local)) {
      applyRemote(row.data, row.updated_at);
      set("synced");
    } else if (!hasUserData(hydrate(row.data))) {
      meta.remote = row.updated_at;
      meta.dirty = true;
      await push(true);
    } else if (meta.remote === row.updated_at) {
      await push(); // solo cambios locales sin enviar
    } else {
      await resolveConflict(row);
    }
  } catch {
    set(navigator.onLine ? "error" : "offline");
  }
}

export function stopSync() {
  clearTimeout(timer);
  unsubscribe?.();
  unsubscribe = null;
  uid = null;
  resolver = null;
  set("idle");
}

/** Al volver a la app: si otro dispositivo guardó algo nuevo y aquí no hay cambios pendientes, se actualiza. */
export async function pullIfNewer() {
  if (!uid || !meta || meta.dirty || pushing) return;
  try {
    const { data, error } = await supabase().from("apex_state").select("updated_at").eq("user_id", uid).limit(1);
    if (error || !data?.[0]) return;
    const at = (data[0] as { updated_at: string }).updated_at;
    if (at !== meta.remote) {
      const row = await fetchRow();
      if (row && !meta.dirty) applyRemote(row.data, row.updated_at);
    }
    set("synced");
  } catch {
    /* sin conexión: se intenta la próxima vez */
  }
}

export const syncNow = () => (uid && meta ? ((meta.dirty = true), push(true)) : Promise.resolve());

/** Antes de cerrar sesión: envía lo pendiente. Devuelve false si no se pudo y habría pérdida de datos. */
export async function flushForSignOut(): Promise<boolean> {
  if (!uid || !meta) return true;
  if (meta.dirty) await push();
  return !meta.dirty;
}

/** Deja este dispositivo limpio (los datos siguen en la cuenta). */
export function clearDevice() {
  stopSync();
  meta = null;
  try {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nada */
  }
  replaceState(defaults());
}

import { findExercise, LARGE_ZONES, type Muscle, type Zone, ZONE_LABEL } from "./exercises";
import { addDays, dkey, parseKey } from "./dates";
import type { GymState } from "./types";

/** Zonas por defecto cuando el ejercicio no está en el catálogo y solo conocemos el grupo. */
const MUSCLE_ZONES: Record<Muscle, Zone[]> = {
  Pecho: ["pecho"], Espalda: ["dorsales"], Hombros: ["hombros"], Bíceps: ["biceps"], Tríceps: ["triceps"],
  Piernas: ["cuadriceps", "isquios", "gluteos"], Core: ["abdomen"],
};

export const ZONES = Object.keys(ZONE_LABEL) as Zone[];

export interface ZoneLoad {
  zone: Zone;
  /** Series ponderadas de los últimos 7 días (la zona principal cuenta 1, las secundarias 0,5). */
  sets: number;
  last: string | null;
  hours: number | null;
}

export type Recovery = "rest" | "recovering" | "ready" | "idle";

export const RECOVERY_LABEL: Record<Recovery, string> = {
  rest: "Déjala descansar",
  recovering: "Recuperándose",
  ready: "Lista para entrenar",
  idle: "Sin trabajar esta semana",
};

/** Carga y último entreno de cada zona del cuerpo. */
export function zoneLoads(gym: GymState, now: Date = new Date(), days = 7, muscleOf?: (name: string) => Muscle | null): ZoneLoad[] {
  const from = dkey(addDays(now, -(days - 1)));
  const acc = new Map<Zone, { sets: number; last: string | null }>(ZONES.map((z) => [z, { sets: 0, last: null }]));
  for (const s of gym.sessions) {
    for (const ex of s.exercises) {
      const found = findExercise(ex.name);
      const m = found ? null : (muscleOf?.(ex.name) ?? null);
      const zones = found ? found.zones : m ? MUSCLE_ZONES[m] : [];
      zones.forEach((z, i) => {
        const entry = acc.get(z)!;
        if (s.date >= from) entry.sets += ex.sets.length * (i === 0 ? 1 : 0.5);
        if (!entry.last || s.date > entry.last) entry.last = s.date;
      });
    }
  }
  const nowMs = now.getTime();
  return ZONES.map((zone) => {
    const { sets, last } = acc.get(zone)!;
    // Se toma el final de ese día como referencia (no guardamos la hora del entreno).
    const hours = last ? Math.max(0, (nowMs - (parseKey(last).getTime() + 18 * 3_600_000)) / 3_600_000) : null;
    return { zone, sets, last, hours };
  });
}

export function recoveryOf(l: ZoneLoad): Recovery {
  if (l.hours === null || l.hours > 24 * 7) return "idle";
  const window = LARGE_ZONES.includes(l.zone) ? 72 : 48;
  if (l.hours < window * 0.5) return "rest";
  if (l.hours < window) return "recovering";
  return "ready";
}

/** Intensidad 0–1 de la carga semanal (10 series ponderadas ≈ muy trabajada). */
export const loadLevel = (l: ZoneLoad) => Math.min(1, l.sets / 10);

import { buildHeatmap, sessionVolume } from "./gym";
import type { GymState } from "./types";

export interface Tier {
  id: string;
  name: string;
  /** Puntos necesarios para entrar en este rango. */
  from: number;
  color: string;
  glow: string;
}

export const TIERS: readonly Tier[] = [
  { id: "hierro", name: "Hierro", from: 0, color: "#a1a1aa", glow: "161,161,170" },
  { id: "bronce", name: "Bronce", from: 150, color: "#cd7f32", glow: "205,127,50" },
  { id: "plata", name: "Plata", from: 400, color: "#d4d8e0", glow: "212,216,224" },
  { id: "oro", name: "Oro", from: 800, color: "#facc15", glow: "250,204,21" },
  { id: "platino", name: "Platino", from: 1400, color: "#5eead4", glow: "94,234,212" },
  { id: "diamante", name: "Diamante", from: 2200, color: "#7dd3fc", glow: "125,211,252" },
  { id: "magno", name: "Magno", from: 3500, color: "#c084fc", glow: "232,121,249" },
];

export interface RankInfo {
  points: number;
  tier: Tier;
  /** 1 = recién llegado al rango, 3 = a punto de subir. 0 en Magno, el último rango (sin divisiones). */
  division: 0 | 1 | 2 | 3;
  next: { name: string; division: number } | null;
  /** Progreso 0–1 hacia la siguiente división. */
  progress: number;
  toNext: number;
}

/** Puntos perdidos por cada 7 días seguidos sin entrenar. */
export const IDLE_PENALTY = 30;

const dayNumber = (key: string) => Math.floor(Date.parse(key + "T00:00:00Z") / 86_400_000);

export interface Inactivity {
  /** Puntos que se han restado en total por semanas sin actividad. */
  penalty: number;
  /** Días sin entrenar desde la última actividad (0 si entrenaste hoy). */
  idleDays: number;
  /** Cuántos días faltan para perder el siguiente bloque de puntos (null si aún no hay actividad). */
  daysLeft: number | null;
}

/**
 * Inactividad: por cada semana completa (7 días) sin entrenar entre dos entrenos —o desde el último hasta hoy—
 * se restan 30 puntos. Cuenta lo mismo un entreno que un día marcado a mano.
 */
export function inactivity(gym: GymState, now: Date = new Date()): Inactivity {
  const days = [...new Set([...gym.sessions.map((s) => s.date), ...Object.keys(gym.marks)])].map(dayNumber).filter(Number.isFinite).sort((a, b) => a - b);
  if (!days.length) return { penalty: 0, idleDays: 0, daysLeft: null };
  const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  let weeks = 0;
  for (let i = 1; i < days.length; i++) weeks += Math.floor((days[i]! - days[i - 1]! - 1) / 7);
  const last = Math.min(days[days.length - 1]!, today);
  const idle = Math.max(0, today - last);
  const trailing = Math.floor(Math.max(0, idle - 1) / 7);
  const next = (trailing + 1) * 7 + 1; // el día en que se cumple la siguiente semana completa sin entrenar
  return { penalty: (weeks + trailing) * IDLE_PENALTY, idleDays: idle, daysLeft: Math.max(0, next - idle) };
}

/**
 * Puntos de experiencia: constancia primero. Cada entreno suma, cada semana que cumples tu meta suma más,
 * y los récords y el volumen dan un empujón. Una semana entera sin entrenar resta 30 (y puede bajarte de división).
 */
export function rankPoints(gym: GymState, now: Date = new Date()): number {
  const sessions = gym.sessions.length;
  const sessionDays = new Set(gym.sessions.map((s) => s.date));
  const markOnly = Object.keys(gym.marks).filter((d) => !sessionDays.has(d)).length;
  const prs = gym.sessions.reduce((n, s) => n + (s.prs?.length ?? 0), 0);
  const volume = gym.sessions.reduce((n, s) => n + sessionVolume(s), 0);
  const weeks = buildHeatmap(gym, now).stats.weeksOnGoal;
  const base = Math.round(sessions * 12 + markOnly * 6 + prs * 8 + weeks * 30 + Math.floor(volume / 10_000) * 2);
  return Math.max(0, base - inactivity(gym, now).penalty);
}

export function rankInfo(points: number): RankInfo {
  let i = TIERS.length - 1;
  while (i > 0 && points < TIERS[i]!.from) i--;
  const tier = TIERS[i]!;
  const after = TIERS[i + 1];
  if (!after) return { points, tier, division: 0, next: null, progress: 1, toNext: 0 };
  const size = (after.from - tier.from) / 3;
  const into = points - tier.from;
  const step = Math.min(2, Math.floor(into / size));
  const stepStart = tier.from + step * size;
  const nextStep = step + 1;
  const lastTier = TIERS[TIERS.length - 1]!;
  return {
    points,
    tier,
    division: (step + 1) as 1 | 2 | 3,
    next: nextStep >= 3 ? { name: after.name, division: after.id === lastTier.id ? 0 : 1 } : { name: tier.name, division: nextStep + 1 },
    progress: Math.min(1, (points - stepStart) / size),
    toNext: Math.max(1, Math.ceil(tier.from + nextStep * size - points)),
  };
}

export interface Level {
  tier: Tier;
  tierIndex: number;
  /** 1–3 (0 en Magno). */
  division: 0 | 1 | 2 | 3;
  /** Puntos necesarios para llegar. */
  from: number;
  label: string;
}

/** Todos los escalones, de Hierro 1 a Magno, en orden. */
export const LEVELS: readonly Level[] = TIERS.flatMap((tier, tierIndex): Level[] => {
  const after = TIERS[tierIndex + 1];
  if (!after) return [{ tier, tierIndex, division: 0 as const, from: tier.from, label: tier.name }];
  const size = (after.from - tier.from) / 3;
  return ([1, 2, 3] as const).map((division) => ({ tier, tierIndex, division, from: Math.round(tier.from + (division - 1) * size), label: `${tier.name} ${division}` }));
});

/** Posición del escalón actual dentro de LEVELS. */
export const levelIndex = (points: number) => {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1]!.from) i++;
  return i;
};

export const rankLabel = (r: RankInfo) => (r.division ? `${r.tier.name} ${r.division}` : r.tier.name);

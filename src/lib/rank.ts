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
  { id: "elite", name: "Élite", from: 3500, color: "#c084fc", glow: "192,132,252" },
];

export interface RankInfo {
  points: number;
  tier: Tier;
  /** 3 = recién llegado al rango, 1 = a punto de subir. 0 en el último rango. */
  division: 0 | 1 | 2 | 3;
  next: { name: string; division: number } | null;
  /** Progreso 0–1 hacia la siguiente división. */
  progress: number;
  toNext: number;
}

/**
 * Puntos de experiencia: constancia primero. Cada entreno suma, cada semana que cumples tu meta suma más,
 * y los récords y el volumen dan un empujón. Nunca bajan.
 */
export function rankPoints(gym: GymState, now: Date = new Date()): number {
  const sessions = gym.sessions.length;
  const sessionDays = new Set(gym.sessions.map((s) => s.date));
  const markOnly = Object.keys(gym.marks).filter((d) => !sessionDays.has(d)).length;
  const prs = gym.sessions.reduce((n, s) => n + (s.prs?.length ?? 0), 0);
  const volume = gym.sessions.reduce((n, s) => n + sessionVolume(s), 0);
  const weeks = buildHeatmap(gym, now).stats.weeksOnGoal;
  return Math.round(sessions * 12 + markOnly * 6 + prs * 8 + weeks * 30 + Math.floor(volume / 10_000) * 2);
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
  return {
    points,
    tier,
    division: (3 - step) as 1 | 2 | 3,
    next: nextStep >= 3 ? { name: after.name, division: 3 } : { name: tier.name, division: 3 - nextStep },
    progress: Math.min(1, (points - stepStart) / size),
    toNext: Math.max(1, Math.ceil(tier.from + nextStep * size - points)),
  };
}

export const ROMAN = ["", "I", "II", "III"] as const;
export const rankLabel = (r: RankInfo) => (r.division ? `${r.tier.name} ${ROMAN[r.division]}` : r.tier.name);

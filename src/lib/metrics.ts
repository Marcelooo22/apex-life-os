import { dkey } from "./dates";
import { weekCount } from "./gym";
import { mealTotals } from "./nutrition";
import type { AppState, ViewId } from "./types";
import { fmt } from "./utils";

export interface Metric {
  /** Progreso 0–1 del anillo. */
  p: number;
  /** Texto bajo el título. */
  t: string;
}

/** Resumen de cada sección para las burbujas de la pantalla de inicio. */
export function landingMetrics(state: AppState, now: Date = new Date()): Record<ViewId, Metric> {
  const today = dkey(now);
  const habits = state.habits.list;
  const habitsDone = habits.filter((h) => h.log[today]).length;
  const week = weekCount(state.gym, now);
  const goal = state.gym.goal || 4;
  const nutrition = mealTotals(state, today);
  const tasks = state.uni.tasks;
  const open = tasks.filter((t) => t.status !== "Entregado");
  const songs = state.hobbies.instruments.flatMap((i) => i.songs);
  const completed = songs.filter((s) => s.status === "Completada").length;

  return {
    gym: { p: week / goal, t: state.gym.active ? "Entreno en curso" : `${week} de ${goal} esta semana` },
    habits: { p: habits.length ? habitsDone / habits.length : 0, t: habits.length ? `${habitsDone} de ${habits.length} hoy` : "Crea el primero" },
    nutrition: { p: nutrition.kcal / state.nutrition.goals.kcal, t: `${fmt(nutrition.kcal)} kcal` },
    hobbies: {
      p: songs.length ? completed / songs.length : 0,
      t: songs.length ? `${completed}/${songs.length} temas listos` : "Sin repertorio",
    },
    uni: {
      p: tasks.length ? (tasks.length - open.length) / tasks.length : 0,
      t: open.length ? `${open.length} ${open.length === 1 ? "entrega" : "entregas"}` : tasks.length ? "Todo entregado" : "Sin entregas",
    },
  };
}

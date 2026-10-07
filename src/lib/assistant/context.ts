import { dkey } from "../dates";
import { personalRecords } from "../gym";
import { rankInfo, rankLabel, rankPoints } from "../rank";
import { streak, weekProgress } from "../habits";
import { mealTotals } from "../nutrition";
import { daysUntil, isUrgent, average, formatGrade } from "../uni";
import type { AppState } from "../types";
import type { SectionId } from "./sections";

/**
 * Resumen corto de la sección para que el asistente responda con tus datos.
 * No incluye peso corporal, medidas ni datos personales de salud.
 */
export function buildContext(scope: SectionId, state: AppState, now: Date = new Date()): string {
  const today = dkey(now);
  const lines: string[] = [];
  if (scope === "gym") {
    const g = state.gym;
    lines.push(`Rango: ${rankLabel(rankInfo(rankPoints(g, now)))}. Meta: ${g.goal} días por semana. Entrenos registrados: ${g.sessions.length}.`);
    const last = g.sessions.at(-1);
    if (last) lines.push(`Último entreno: ${last.split} el ${last.date}.`);
    lines.push(`Rutinas: ${Object.entries(g.routines).map(([n, l]) => `${n} (${l.length} ejercicios)`).join(", ") || "ninguna"}.`);
    lines.push(`Escala de esfuerzo: ${g.effort}.`);
    const prs = personalRecords(g, now).slice(0, 3).map((p) => `${p.name} ${p.kind === "load" ? Math.round(p.e1rm) + " kg" : p.reps + " reps"}`);
    if (prs.length) lines.push(`Mejores marcas: ${prs.join("; ")}.`);
  } else if (scope === "habits") {
    lines.push(`Hábitos (${state.habits.list.length}): ` + state.habits.list.slice(0, 12).map((h) => `${h.name} (racha ${streak(h, now)}, semana ${weekProgress(h, now).done}/${weekProgress(h, now).planned})`).join("; ") + ".");
  } else if (scope === "nutrition") {
    const t = mealTotals(state, today);
    const g = state.nutrition.goals;
    lines.push(`Hoy: ${Math.round(t.kcal)} de ${g.kcal} kcal; proteína ${Math.round(t.p)}/${g.p} g, carbohidratos ${Math.round(t.c)}/${g.c} g, grasas ${Math.round(t.f)}/${g.f} g.`);
    const meals = state.nutrition.days[today]?.meals.map((m) => m.name).slice(0, 8);
    if (meals?.length) lines.push(`Comidas de hoy: ${meals.join(", ")}.`);
  } else if (scope === "hobbies") {
    for (const i of state.hobbies.instruments.slice(0, 4)) {
      lines.push(`${i.name} (${i.detail || "sin detalle"}): ` + (i.songs.slice(0, 10).map((s) => `${s.title} [${s.status}${s.bpmTarget ? `, ${s.bpmTarget} BPM` : ""}${s.key ? `, ${s.key}` : ""}]`).join("; ") || "sin canciones") + ".");
    }
  } else {
    const u = state.uni;
    const urgent = u.tasks.filter((t) => isUrgent(t, today)).slice(0, 5).map((t) => `${t.title} (${t.due})`);
    lines.push(`Asignaturas: ${u.subjects.map((s) => s.name).join(", ") || "ninguna"}. Escala de notas sobre ${u.scale}.`);
    if (urgent.length) lines.push(`Urgente: ${urgent.join("; ")}.`);
    const next = u.tasks.filter((t) => t.status !== "Entregado" && t.due).sort((a, b) => a.due.localeCompare(b.due))[0];
    if (next) lines.push(`Próxima: ${next.title} en ${daysUntil(next.due, today)} días.`);
    const avg = average(u.tasks);
    if (avg) lines.push(`Promedio general: ${formatGrade(avg.value)}.`);
  }
  return lines.join("\n").slice(0, 1400);
}

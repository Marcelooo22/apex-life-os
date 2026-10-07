import { isScheduled, timeToMinutes } from "./habits";
import { addDays, dkey, parseKey, weekStart } from "./dates";
import type { AppState, Semester, Task, TaskKind, UniState } from "./types";
import { num } from "./utils";

export interface DueInfo {
  text: string;
  /** "warn" = próxima, "over" = vencida. */
  tone: "" | "warn" | "over";
}

/** Días que faltan para una fecha (negativo = ya pasó). */
export const daysUntil = (key: string, today: string = dkey()) =>
  Math.round((parseKey(key).getTime() - parseKey(today).getTime()) / 864e5);

/** Texto y tono de una fecha límite ("Mañana", "Venció hace 2 días"…). */
export function dueInfo(key: string): DueInfo {
  if (!key) return { text: "Sin fecha", tone: "" };
  const diff = daysUntil(key);
  const label = parseKey(key).toLocaleDateString("es", { day: "numeric", month: "short" });
  if (diff < 0) return { text: `Venció hace ${-diff} ${diff === -1 ? "día" : "días"}`, tone: "over" };
  if (diff === 0) return { text: "Hoy", tone: "warn" };
  if (diff === 1) return { text: "Mañana", tone: "warn" };
  if (diff <= 3) return { text: `En ${diff} días, ${label}`, tone: "warn" };
  return { text: `En ${diff} días, ${label}`, tone: "" };
}

export const taskKind = (t: Task): TaskKind => t.kind ?? "Entrega";
export const isOpen = (t: Task) => t.status !== "Entregado";

/** Urgente: sin entregar y vence en 2 días o menos (o ya venció). */
export const isUrgent = (t: Task, today: string = dkey()) => isOpen(t) && !!t.due && daysUntil(t.due, today) <= 2;

/** Esta semana: sin entregar y vence entre hoy y el domingo. */
export function isThisWeek(t: Task, now: Date = new Date()) {
  if (!isOpen(t) || !t.due) return false;
  const end = dkey(addDays(weekStart(now), 6));
  return t.due >= dkey(now) && t.due <= end;
}

/* ===================== Notas y promedios ===================== */
export interface Average {
  value: number;
  count: number;
}

/** Promedio ponderado de las evaluaciones con nota. Sin pesos, todas valen lo mismo. */
export function average(tasks: readonly Task[]): Average | null {
  const graded = tasks.filter((t) => t.grade !== undefined && t.grade !== "" && Number.isFinite(num(t.grade)));
  if (!graded.length) return null;
  const weighted = graded.filter((t) => num(t.weight) > 0);
  if (weighted.length === graded.length) {
    const weight = weighted.reduce((s, t) => s + num(t.weight), 0);
    return { value: weighted.reduce((s, t) => s + num(t.grade) * num(t.weight), 0) / weight, count: graded.length };
  }
  return { value: graded.reduce((s, t) => s + num(t.grade), 0) / graded.length, count: graded.length };
}

export const subjectAverage = (uni: UniState, subjectId: string) => average(uni.tasks.filter((t) => t.subject === subjectId));

/** Tono de una nota respecto a la escala: para colorear el badge. */
export const gradeTone = (value: number, scale: number): "good" | "ok" | "low" => {
  const ratio = scale ? value / scale : 0;
  return ratio >= 0.7 ? "good" : ratio >= 0.5 ? "ok" : "low";
};

export const formatGrade = (value: number) => (Math.round(value * 100) / 100).toLocaleString("es", { maximumFractionDigits: 2 });

/* ===================== Semestre ===================== */
export function semesterProgress(semester: Semester | null, today: string = dkey()) {
  if (!semester?.start || !semester.end) return null;
  const start = parseKey(semester.start).getTime();
  const end = parseKey(semester.end).getTime();
  if (end <= start) return null;
  const now = parseKey(today).getTime();
  const p = Math.min(1, Math.max(0, (now - start) / (end - start)));
  return { p, daysLeft: Math.max(0, Math.round((end - now) / 864e5)), started: now >= start, ended: now > end };
}

/* ===================== Agenda ===================== */
export interface AgendaItem {
  id: string;
  kind: "task" | "exam" | "habit";
  title: string;
  detail: string;
  /** Minutos desde medianoche (null = todo el día). */
  start: number | null;
  /** Duración en minutos del bloque que ocupa. */
  mins: number;
  done: boolean;
  /** Se solapa con otro bloque del mismo día. */
  clash: boolean;
}

/** Eventos de un día: entregas, prácticas, parciales y recordatorios de hábitos, ordenados por hora. */
export function agendaFor(state: AppState, key: string): AgendaItem[] {
  const date = parseKey(key);
  const items: AgendaItem[] = [];

  state.uni.tasks
    .filter((t) => t.due === key)
    .forEach((t) => {
      const subject = state.uni.subjects.find((s) => s.id === t.subject)?.name ?? "";
      const kind = taskKind(t);
      items.push({
        id: t.id,
        kind: kind === "Parcial" ? "exam" : "task",
        title: t.title,
        detail: [kind, subject].filter(Boolean).join(", "),
        start: timeToMinutes(t.time),
        mins: t.mins && t.mins > 0 ? t.mins : 60,
        done: t.status === "Entregado",
        clash: false,
      });
    });

  state.habits.list
    .filter((h) => h.reminder && h.created <= key && isScheduled(h, date))
    .forEach((h) => {
      items.push({
        id: `h-${h.id}`,
        kind: "habit",
        title: h.name,
        detail: "Hábito",
        start: timeToMinutes(h.reminder),
        mins: 15,
        done: !!h.log[key],
        clash: false,
      });
    });

  items.sort((a, b) => (a.start ?? -1) - (b.start ?? -1) || a.title.localeCompare(b.title, "es"));

  // Solo se marcan solapes entre entregas/exámenes con hora; los recordatorios son avisos puntuales.
  const timed = items.filter((i) => i.kind !== "habit" && i.start !== null);
  timed.forEach((a, i) =>
    timed.forEach((b, j) => {
      if (i !== j && a.start! < b.start! + b.mins && b.start! < a.start! + a.mins) a.clash = true;
    }),
  );
  return items;
}

export const formatClock = (mins: number) =>
  new Date(2000, 0, 1, Math.floor(mins / 60), mins % 60).toLocaleTimeString("es", { hour: "numeric", minute: "2-digit" });

/** Cuadrícula de un mes (lunes primero). Los huecos iniciales son null. */
export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const leading = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array<null>(leading).fill(null), ...Array.from({ length: days }, (_, i) => dkey(new Date(year, month, i + 1)))];
}

import { ALL_DAYS, HABIT_CATEGORIES } from "../constants";
import { clean, sanitizeSpec, type ModuleSpec } from "../custom";
import type { HabitCategory, Slot } from "../types";

export interface HabitSpec {
  name: string;
  category: HabitCategory;
  days: number[];
  /** "HH:MM" o vacío. */
  reminder: string;
  slot: Slot;
}

export interface RoutineSpec {
  name: string;
  exercises: string[];
}

/** Lo que el asistente devuelve a la interfaz. */
export type Proposal =
  | { kind: "module"; reply: string; spec: ModuleSpec }
  | { kind: "habit"; reply: string; habit: HabitSpec }
  | { kind: "routine"; reply: string; routine: RoutineSpec }
  | { kind: "reply"; reply: string; pending?: { kind: "routine"; name: string } };

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

const SLOTS: readonly Slot[] = ["morning", "afternoon", "night"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function sanitizeHabit(raw: unknown): HabitSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = clean(r.name, 40);
  if (!name) return null;
  const days = Array.isArray(r.days)
    ? [...new Set(r.days.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort()
    : [];
  const reminder = typeof r.reminder === "string" && TIME_RE.test(r.reminder) ? r.reminder : "";
  return {
    name,
    category: HABIT_CATEGORIES.find((c) => c.id === r.category)?.id ?? "health",
    days: days.length ? days : [...ALL_DAYS],
    reminder,
    slot: SLOTS.find((s) => s === r.slot) ?? "morning",
  };
}

export function sanitizeRoutine(raw: unknown): RoutineSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name = clean(r.name, 24);
  const exercises = Array.isArray(r.exercises)
    ? [...new Set(r.exercises.map((e) => clean(e, 40)).filter(Boolean))].slice(0, 12)
    : [];
  return name && exercises.length ? { name, exercises } : null;
}

/** Valida cualquier respuesta (de la IA o del intérprete local). Devuelve null si no es usable. */
export function sanitizeProposal(raw: unknown): Proposal | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const reply = clean(r.reply, 300);
  if (r.kind === "module") {
    const spec = sanitizeSpec(r.spec);
    return spec ? { kind: "module", reply: reply || `Te propongo el panel «${spec.name}».`, spec } : null;
  }
  if (r.kind === "habit") {
    const habit = sanitizeHabit(r.habit);
    return habit ? { kind: "habit", reply: reply || `Te propongo el hábito «${habit.name}».`, habit } : null;
  }
  if (r.kind === "routine") {
    const routine = sanitizeRoutine(r.routine);
    return routine ? { kind: "routine", reply: reply || `Te propongo la rutina «${routine.name}».`, routine } : null;
  }
  if (r.kind === "reply" && reply) return { kind: "reply", reply };
  return null;
}

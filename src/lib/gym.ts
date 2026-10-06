import { addDays, dkey, weekStart } from "./dates";
import type { ActiveExercise, ActiveWorkout, GymState, LoggedSet, Session } from "./types";
import { num, uid } from "./utils";

export const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Días con entreno registrado o marcado a mano. */
export const gymDays = (gym: GymState) => {
  const days = new Set(Object.keys(gym.marks));
  gym.sessions.forEach((s) => days.add(s.date));
  return days;
};

export function weekCount(gym: GymState, now: Date = new Date()) {
  const days = gymDays(gym);
  const start = weekStart(now);
  let n = 0;
  for (let i = 0; i < 7; i++) if (days.has(dkey(addDays(start, i)))) n++;
  return n;
}

/** Todos los ejercicios conocidos (rutinas + historial), para autocompletar. */
export const exerciseLibrary = (gym: GymState) =>
  [
    ...new Set([...Object.values(gym.routines).flat(), ...gym.sessions.flatMap((s) => s.exercises.map((e) => e.name))]),
  ].sort((a, b) => a.localeCompare(b, "es"));

/** Series de la última vez que se hizo un ejercicio. */
export function lastSets(gym: GymState, name: string): LoggedSet[] {
  for (let i = gym.sessions.length - 1; i >= 0; i--) {
    const session = gym.sessions[i];
    const exercise = session?.exercises.find((x) => sameName(x.name, name));
    if (exercise) return exercise.sets;
  }
  return [];
}

/** 1RM estimado (fórmula de Epley). */
export const e1rm = (s: LoggedSet) => (num(s.kg) > 0 && num(s.reps) > 0 ? num(s.kg) * (1 + num(s.reps) / 30) : 0);

export const sessionVolume = (s: Session) =>
  s.exercises.reduce((total, e) => total + e.sets.reduce((sub, x) => sub + num(x.kg) * num(x.reps), 0), 0);

export function newExercise(gym: GymState, name: string): ActiveExercise {
  const count = Math.max(lastSets(gym, name).length, 3);
  return {
    id: uid(),
    name: name.trim(),
    sets: Array.from({ length: count }, () => ({ kg: "", reps: "", rpe: "", done: false })),
  };
}

export function createWorkout(gym: GymState, split: string): ActiveWorkout {
  const names = gym.routines[split] ?? [];
  return {
    id: uid(),
    date: dkey(),
    split,
    start: Date.now(),
    exercises: names.map((n) => newExercise(gym, n)),
  };
}

/** Convierte el entreno en curso en una sesión guardable. Devuelve null si no hay series hechas. */
export function buildSession(gym: GymState): Session | null {
  const active = gym.active;
  if (!active) return null;
  const exercises = active.exercises
    .map((e) => ({
      name: e.name,
      sets: e.sets.filter((s) => s.done).map((s) => ({ kg: s.kg, reps: s.reps, rpe: s.rpe })),
    }))
    .filter((e) => e.sets.length);
  if (!exercises.length) return null;

  const prs = exercises
    .filter((e) => {
      const best = Math.max(...e.sets.map(e1rm));
      let previous = 0;
      gym.sessions.forEach((s) =>
        s.exercises.forEach((x) => {
          if (sameName(x.name, e.name)) previous = Math.max(previous, ...x.sets.map(e1rm));
        }),
      );
      return previous > 0 && best > previous;
    })
    .map((e) => e.name);

  return {
    id: active.id,
    date: active.date,
    split: active.split,
    mins: Math.max(1, Math.round((Date.now() - active.start) / 60000)),
    exercises,
    prs,
  };
}

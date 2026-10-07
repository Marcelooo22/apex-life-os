import { addDays, dkey, parseKey, weekStart } from "./dates";
import { exerciseMuscle, findExercise, type Muscle } from "./exercises";
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

export const sessionSets = (s: Session) => s.exercises.reduce((total, e) => total + e.sets.length, 0);

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

/* ===================== Grupos musculares ===================== */
export type { Muscle };
export type RadarAxis = "Pecho" | "Espalda" | "Hombros" | "Brazos" | "Piernas" | "Core";
export const RADAR_AXES: readonly RadarAxis[] = ["Pecho", "Espalda", "Hombros", "Brazos", "Piernas", "Core"];

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** El orden importa: la primera regla que coincide gana (p. ej. "curl femoral" es pierna, no bíceps). */
const MUSCLE_RULES: readonly (readonly [RegExp, Muscle])[] = [
  [/abdomin|plancha|crunch|\babs\b|\bcore\b|rueda|elevacion(es)? de piernas|lumbar/, "Core"],
  [/femoral|isquio|gluteo|hip ?thrust|sentadilla|\bprensa\b|zancada|desplante|cuadricep|gemelo|pantorrilla|peso muerto|extension de pierna|abductor|aductor|\bsquat|\blunge|\bleg\b/, "Piernas"],
  [/triceps|frances|\bcopa\b|patada|press cerrado|fondos en banco/, "Tríceps"],
  [/biceps|\bcurl|martillo|predicador/, "Bíceps"],
  [/militar|hombro|elevacion(es)? (lateral|frontal)|vuelos|pajaro|face ?pull|arnold|deltoid/, "Hombros"],
  [/dominada|\bremo\b|jalon|pull ?over|espalda|dorsal|trapecio|encogimiento|buenos dias/, "Espalda"],
  [/banca|pecho|aperturas|cruce|press (inclinado|declinado)|fondos|flexion|push ?up|pec ?deck|contractora/, "Pecho"],
];

export function muscleOf(exercise: string): Muscle | null {
  const known = findExercise(exercise);
  if (known) return exerciseMuscle(known);
  const name = fold(exercise);
  return MUSCLE_RULES.find(([re]) => re.test(name))?.[1] ?? null;
}

export const radarAxisOf = (m: Muscle): RadarAxis => (m === "Bíceps" || m === "Tríceps" ? "Brazos" : m);

/** Los dos grupos más trabajados de una sesión: "Pecho / Bíceps". Si no se reconocen, el nombre de la división. */
export function sessionMuscles(s: Session): string {
  const sets = new Map<Muscle, number>();
  s.exercises.forEach((e) => {
    const m = muscleOf(e.name);
    if (m) sets.set(m, (sets.get(m) ?? 0) + e.sets.length);
  });
  const top = [...sets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m]) => m);
  return top.length ? top.join(" / ") : s.split;
}

export interface MuscleLoad {
  axis: RadarAxis;
  volume: number;
  sets: number;
}

/** Volumen (kg × reps) y series por grupo muscular en los últimos `days` días. */
export function muscleLoad(gym: GymState, now: Date = new Date(), days = 30): MuscleLoad[] {
  const from = dkey(addDays(now, -(days - 1)));
  const acc = new Map<RadarAxis, MuscleLoad>(RADAR_AXES.map((axis) => [axis, { axis, volume: 0, sets: 0 }]));
  gym.sessions
    .filter((s) => s.date >= from)
    .forEach((s) =>
      s.exercises.forEach((e) => {
        const m = muscleOf(e.name);
        if (!m) return;
        const entry = acc.get(radarAxisOf(m));
        if (!entry) return;
        entry.sets += e.sets.length;
        entry.volume += e.sets.reduce((sum, x) => sum + num(x.kg) * num(x.reps), 0);
      }),
    );
  return [...acc.values()];
}

/* ===================== Récords personales ===================== */
export interface PersonalRecord {
  name: string;
  muscle: Muscle | null;
  /** "load" = mejor 1RM estimado; "reps" = ejercicio con peso corporal (más repeticiones). */
  kind: "load" | "reps";
  e1rm: number;
  kg: number;
  reps: number;
  date: string;
  /** Días desde que se logró. */
  age: number;
}

export function personalRecords(gym: GymState, now: Date = new Date()): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  const today = parseKey(dkey(now)).getTime();
  gym.sessions.forEach((s) =>
    s.exercises.forEach((e) => {
      const key = e.name.trim().toLowerCase();
      e.sets.forEach((set) => {
        const kg = num(set.kg);
        const reps = num(set.reps);
        if (reps <= 0) return;
        const kind: PersonalRecord["kind"] = kg > 0 ? "load" : "reps";
        const score = kind === "load" ? e1rm(set) : reps;
        const current = best.get(key);
        const currentScore = current ? (current.kind === "load" ? current.e1rm : current.reps) : -1;
        if (current && current.kind === "load" && kind === "reps") return;
        if (!current || (current.kind === "reps" && kind === "load") || score > currentScore) {
          best.set(key, {
            name: e.name.trim(),
            muscle: muscleOf(e.name),
            kind,
            e1rm: kind === "load" ? score : 0,
            kg,
            reps,
            date: s.date,
            age: Math.round((today - parseKey(s.date).getTime()) / 864e5),
          });
        }
      });
    }),
  );
  return [...best.values()].sort((a, b) => (a.kind === b.kind ? (a.kind === "load" ? b.e1rm - a.e1rm : b.reps - a.reps) : a.kind === "load" ? -1 : 1));
}

/** Medalla según lo reciente del récord: oro ≤ 30 días, plata ≤ 90, bronce el resto. */
export const medalOf = (age: number): "gold" | "silver" | "bronze" => (age <= 30 ? "gold" : age <= 90 ? "silver" : "bronze");

/* ===================== Resumen semanal ===================== */
export function weekSummary(gym: GymState, now: Date = new Date()) {
  const start = dkey(weekStart(now));
  const end = dkey(addDays(weekStart(now), 6));
  const sessions = gym.sessions.filter((s) => s.date >= start && s.date <= end);
  return {
    days: weekCount(gym, now),
    goal: gym.goal || 4,
    sessions: sessions.length,
    volume: sessions.reduce((sum, s) => sum + sessionVolume(s), 0),
    mins: sessions.reduce((sum, s) => sum + (s.mins || 0), 0),
  };
}

/* ===================== Mapa de calor anual ===================== */
export interface HeatCell {
  key: string;
  /** 0 = descanso, 1–4 = intensidad. */
  level: 0 | 1 | 2 | 3 | 4;
  /** Marcado a mano en el calendario, sin entreno registrado. */
  marked: boolean;
  volume: number;
  sets: number;
  mins: number;
  muscles: string;
  splits: string;
}

export interface Heatmap {
  /** Columnas = semanas (lunes → domingo). Las celdas futuras son null. */
  weeks: (HeatCell | null)[][];
  /** Etiquetas de mes sobre las columnas. */
  months: { label: string; col: number }[];
  stats: { activeDays: number; volume: number; weeksOnGoal: number; weekStreak: number; weeks: number };
}

export const HEAT_WEEKS = 53;

export function buildHeatmap(gym: GymState, now: Date = new Date()): Heatmap {
  const today = dkey(now);
  const first = weekStart(addDays(now, -7 * (HEAT_WEEKS - 1)));

  const byDay = new Map<string, { sessions: Session[]; volume: number; sets: number; mins: number }>();
  gym.sessions.forEach((s) => {
    const day = byDay.get(s.date) ?? { sessions: [], volume: 0, sets: 0, mins: 0 };
    day.sessions.push(s);
    day.volume += sessionVolume(s);
    day.sets += sessionSets(s);
    day.mins += s.mins || 0;
    byDay.set(s.date, day);
  });

  const totalVolume = [...byDay.values()].reduce((sum, d) => sum + d.volume, 0);
  const metric = (d: { volume: number; sets: number }) => (totalVolume > 0 ? d.volume : d.sets);
  const values = [...byDay.values()].map(metric).filter((v) => v > 0).sort((a, b) => a - b);
  const max = values[values.length - 1] ?? 0;
  const quantile = (q: number) => values[Math.min(values.length - 1, Math.floor(q * values.length))] ?? 0;

  const levelOf = (value: number): 1 | 2 | 3 | 4 => {
    if (value <= 0) return 1;
    if (values.length >= 8) return value <= quantile(0.25) ? 1 : value <= quantile(0.5) ? 2 : value <= quantile(0.75) ? 3 : 4;
    const ratio = max ? value / max : 1;
    return ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
  };

  const weeks: (HeatCell | null)[][] = [];
  const months: Heatmap["months"] = [];
  let lastMonth = -1;
  let activeDays = 0;
  let volume = 0;
  const weekHits: number[] = [];

  for (let w = 0; w < HEAT_WEEKS; w++) {
    const monday = addDays(first, w * 7);
    if (monday.getMonth() !== lastMonth) {
      lastMonth = monday.getMonth();
      months.push({ label: monday.toLocaleDateString("es", { month: "short" }).replace(".", ""), col: w });
    }
    let hits = 0;
    const column: (HeatCell | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(monday, d);
      const key = dkey(date);
      if (key > today) {
        column.push(null);
        continue;
      }
      const day = byDay.get(key);
      const marked = !day && !!gym.marks[key];
      const on = !!day || marked;
      if (on) {
        activeDays++;
        hits++;
      }
      if (day) volume += day.volume;
      column.push({
        key,
        level: day ? levelOf(metric(day)) : marked ? 1 : 0,
        marked,
        volume: day?.volume ?? 0,
        sets: day?.sets ?? 0,
        mins: day?.mins ?? 0,
        muscles: day ? [...new Set(day.sessions.map(sessionMuscles))].join(" · ") : "",
        splits: day ? [...new Set(day.sessions.map((s) => s.split))].join(" + ") : "",
      });
    }
    weekHits.push(hits);
    weeks.push(column);
  }

  // La etiqueta del primer mes se omite si el siguiente queda demasiado cerca.
  if (months.length > 1 && months[1] && months[1].col - (months[0]?.col ?? 0) < 3) months.shift();

  const goal = gym.goal || 4;
  const weeksOnGoal = weekHits.filter((h) => h >= goal).length;
  // Racha: semanas seguidas con la meta cumplida; la semana en curso solo cuenta si ya la cumpliste.
  let weekStreak = 0;
  for (let i = weekHits.length - 1; i >= 0; i--) {
    const hit = (weekHits[i] ?? 0) >= goal;
    if (hit) weekStreak++;
    else if (i === weekHits.length - 1) continue;
    else break;
  }

  return { weeks, months, stats: { activeDays, volume, weeksOnGoal, weekStreak, weeks: HEAT_WEEKS } };
}

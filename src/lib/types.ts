/* ===================== Navegación y temas ===================== */
export const VIEW_IDS = ["gym", "habits", "nutrition", "hobbies", "uni"] as const;
export type ViewId = (typeof VIEW_IDS)[number];
export type Theme = ViewId | "none";

export const isViewId = (value: unknown): value is ViewId =>
  typeof value === "string" && (VIEW_IDS as readonly string[]).includes(value);

/* ===================== Gym ===================== */
export type EffortScale = "RPE" | "RIR";

/** Serie en un entreno en curso (los campos son texto porque vienen de inputs). */
export interface ActiveSet {
  kg: string;
  reps: string;
  rpe: string;
  done: boolean;
}

export interface ActiveExercise {
  id: string;
  name: string;
  sets: ActiveSet[];
}

export interface ActiveWorkout {
  id: string;
  date: string;
  split: string;
  start: number;
  exercises: ActiveExercise[];
}

export interface LoggedSet {
  kg: string;
  reps: string;
  rpe: string;
}

export interface LoggedExercise {
  name: string;
  sets: LoggedSet[];
}

export interface Session {
  id: string;
  date: string;
  split: string;
  mins: number;
  exercises: LoggedExercise[];
  prs: string[];
}

export interface GymState {
  goal: number;
  rest: number;
  effort: EffortScale;
  marks: Record<string, true>;
  sessions: Session[];
  active: ActiveWorkout | null;
  routines: Record<string, string[]>;
}

/* ===================== Hábitos ===================== */
export type Slot = "morning" | "afternoon" | "night";

export interface Habit {
  id: string;
  name: string;
  slot: Slot;
  created: string;
  log: Record<string, true>;
}

export interface HabitsState {
  list: Habit[];
  sleep: Record<string, number>;
}

/* ===================== Nutrición ===================== */
export type MealType = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface NutritionDay {
  water: number;
  meals: Meal[];
}

export interface NutritionGoals {
  kcal: number;
  p: number;
  c: number;
  f: number;
  water: number;
}

export interface NutritionState {
  goals: NutritionGoals;
  days: Record<string, NutritionDay>;
}

export interface MacroTotals {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

/* ===================== Hobbies ===================== */
export type SongStatus = "Por aprender" | "En proceso" | "Afinación" | "Velocidad" | "Completada";

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  key: string;
  bpmCurrent: number | "";
  bpmTarget: number | "";
  status: SongStatus;
  link: string;
  notes: string;
}

export interface Instrument {
  id: string;
  name: string;
  detail: string;
  songs: Song[];
}

export interface CatalogSong {
  title: string;
  artist: string;
  genre: string;
  key: string;
  bpm: number;
  instrument: string;
}

/* ===================== Universidad ===================== */
export type SubjectKind = "Materia" | "Proyecto";
export type TaskStatus = "Pendiente" | "En proceso" | "Entregado";

export interface Subject {
  id: string;
  name: string;
  kind: SubjectKind;
  drive: string;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  due: string;
  status: TaskStatus;
}

/* ===================== Estado global ===================== */
export interface AppState {
  v: 2;
  name: string;
  gym: GymState;
  habits: HabitsState;
  nutrition: NutritionState;
  hobbies: { instruments: Instrument[] };
  uni: { subjects: Subject[]; tasks: Task[] };
}

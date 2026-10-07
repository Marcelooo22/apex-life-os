/* ===================== Navegación y temas ===================== */
export const VIEW_IDS = ["gym", "habits", "nutrition", "hobbies", "uni"] as const;
export type BuiltinViewId = (typeof VIEW_IDS)[number];
/** Los módulos que crea el asistente tienen un id con este formato: "c-" + letras/números. */
export type CustomViewId = `c-${string}`;
export type ViewId = BuiltinViewId | CustomViewId;
export type Theme = ViewId | "none";

export const isBuiltinViewId = (value: unknown): value is BuiltinViewId =>
  typeof value === "string" && (VIEW_IDS as readonly string[]).includes(value);

export const isCustomViewId = (value: unknown): value is CustomViewId =>
  typeof value === "string" && /^c-[a-z0-9]{3,24}$/.test(value);

export const isViewId = (value: unknown): value is ViewId => isBuiltinViewId(value) || isCustomViewId(value);

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

export type Sex = "male" | "female" | "";
export type BodyGoal = "" | "muscle" | "fat" | "strength" | "health";

/** Una medición corporal (solo el peso es obligatorio). */
export interface BodyEntry {
  id: string;
  date: string;
  weight: number;
  /** % de grasa corporal. */
  fat?: number;
  /** % de masa muscular. */
  muscle?: number;
  /** Cintura en cm. */
  waist?: number;
}

export interface GymProfile {
  sex: Sex;
  /** Altura en cm. */
  height: number | "";
  goal: BodyGoal;
}

export interface GymState {
  profile: GymProfile;
  body: BodyEntry[];
  /** Arranca el descanso solo al completar una serie. */
  autoRest: boolean;
  /** Mostrar la casilla de esfuerzo (RPE/RIR). Si falta, solo aparece si ya usabas esfuerzo. */
  showEffort?: boolean;
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

export type HabitCategory = "health" | "mind" | "body" | "learning" | "work" | "social" | "home" | "money";

/** Hábitos que se completan solos al hacer algo en otra sección. "none" = manual. */
export type HabitLink = "none" | "gym" | "water";

export interface Habit {
  id: string;
  name: string;
  slot: Slot;
  created: string;
  log: Record<string, true>;
  category?: HabitCategory;
  /** Días de la semana en que aplica: 0 = lunes … 6 = domingo. Si falta, todos los días. */
  days?: number[];
  /** Hora del recordatorio "HH:MM" (vacío = sin recordatorio). */
  reminder?: string;
  link?: HabitLink;
  /** Días marcados automáticamente por un vínculo (para poder quitarlos si el origen desaparece). */
  auto?: Record<string, true>;
}

export interface HabitsState {
  list: Habit[];
  sleep: Record<string, number>;
}

/* ===================== Nutrición ===================== */
export type MealType = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

export interface MacroTotals {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface Meal {
  id: string;
  name: string;
  type: MealType;
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** Si viene de la base de datos nutricional: gramos y valores por 100 g (para poder reajustar). */
  grams?: number;
  per100?: MacroTotals;
  brand?: string;
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

/* ===================== Hobbies ===================== */
export type SongStatus = "Por aprender" | "En práctica" | "Dominada";

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
  album?: string;
  /** URL de la carátula oficial. */
  cover?: string;
  durationSec?: number;
  tuning?: string;
}

export interface Instrument {
  id: string;
  name: string;
  detail: string;
  songs: Song[];
}

/* ===================== Universidad ===================== */
export type SubjectKind = "Materia" | "Proyecto";
export type TaskStatus = "Pendiente" | "En proceso" | "Entregado";
export type TaskKind = "Entrega" | "Práctica" | "Parcial";

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
  kind?: TaskKind;
  /** Hora "HH:MM" que ocupa en la agenda (vacío = todo el día). */
  time?: string;
  /** Duración en minutos del bloque de agenda. */
  mins?: number;
  /** Nota obtenida y su peso (%) en la asignatura. */
  grade?: number | "";
  weight?: number | "";
}

export interface Semester {
  name: string;
  start: string;
  end: string;
}

export interface UniState {
  subjects: Subject[];
  tasks: Task[];
  /** Nota máxima de la escala (10, 5, 100…). */
  scale: number;
  semester: Semester | null;
  notes: string;
  /** Minutos de enfoque (Pomodoro) por día. */
  focus: Record<string, number>;
}

/* ===================== Módulos personalizados (asistente) ===================== */
export type CustomTemplate = "checklist" | "counter" | "ledger" | "journal";

export interface CustomItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CustomEntry {
  id: string;
  date: string;
  /** Importe con signo (solo "ledger"). */
  amount?: number;
  text: string;
  tag?: string;
  /** Ánimo de 1 a 5 (solo "journal"). */
  mood?: number;
}

export interface CustomModule {
  id: CustomViewId;
  name: string;
  /** Nombre de icono permitido (ver CUSTOM_ICONS). */
  icon: string;
  /** Color en #rrggbb tomado de la paleta. */
  color: string;
  template: CustomTemplate;
  description: string;
  unit: string;
  goal: number;
  currency: string;
  created: string;
  items: CustomItem[];
  log: Record<string, number>;
  entries: CustomEntry[];
  /** Cantidades rápidas del contador. */
  quick: number[];
}

/* ===================== Preferencias y estado global ===================== */
export type MusicPlatform = "spotify" | "youtube" | "apple" | "deezer";

export interface AppState {
  v: 2;
  name: string;
  prefs: { musicPlatform: MusicPlatform };
  gym: GymState;
  habits: HabitsState;
  nutrition: NutritionState;
  hobbies: { instruments: Instrument[] };
  uni: UniState;
  custom: CustomModule[];
}

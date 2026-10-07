import type { HabitCategory, MealType, Slot, SongStatus, TaskKind, TaskStatus } from "./types";

export const STORAGE_KEY = "apex.v2";

export const SONG_STATUS: readonly SongStatus[] = ["Por aprender", "En práctica", "Dominada"];

export const TASK_STATUS: readonly TaskStatus[] = ["Pendiente", "En proceso", "Entregado"];
export const TASK_KINDS: readonly TaskKind[] = ["Entrega", "Práctica", "Parcial"];

export const SLOTS: readonly (readonly [Slot, string])[] = [
  ["morning", "Mañana"],
  ["afternoon", "Tarde"],
  ["night", "Noche"],
];

export const MEALS: readonly (readonly [MealType, string])[] = [
  ["Desayuno", "🍳 Desayuno"],
  ["Almuerzo", "🍽️ Almuerzo"],
  ["Cena", "🌙 Cena"],
  ["Snack", "🍪 Snack"],
];

/** Días de la semana, de lunes (0) a domingo (6). */
export const WEEKDAYS = [
  { short: "L", long: "Lunes" },
  { short: "M", long: "Martes" },
  { short: "X", long: "Miércoles" },
  { short: "J", long: "Jueves" },
  { short: "V", long: "Viernes" },
  { short: "S", long: "Sábado" },
  { short: "D", long: "Domingo" },
] as const;

export const ALL_DAYS: readonly number[] = [0, 1, 2, 3, 4, 5, 6];

export interface CategoryInfo {
  id: HabitCategory;
  label: string;
  icon: "heart" | "sparkle" | "dumbbell" | "book" | "briefcase" | "users" | "home" | "wallet";
  /** Color en r,g,b para los acentos de la categoría. */
  rgb: string;
}

export const HABIT_CATEGORIES: readonly CategoryInfo[] = [
  { id: "health", label: "Salud", icon: "heart", rgb: "251,113,133" },
  { id: "mind", label: "Mente", icon: "sparkle", rgb: "196,181,253" },
  { id: "body", label: "Cuerpo", icon: "dumbbell", rgb: "251,146,60" },
  { id: "learning", label: "Aprender", icon: "book", rgb: "125,211,252" },
  { id: "work", label: "Trabajo", icon: "briefcase", rgb: "253,224,71" },
  { id: "social", label: "Social", icon: "users", rgb: "244,114,182" },
  { id: "home", label: "Hogar", icon: "home", rgb: "167,243,208" },
  { id: "money", label: "Dinero", icon: "wallet", rgb: "110,231,183" },
];

export const categoryOf = (id: HabitCategory | undefined): CategoryInfo | undefined => HABIT_CATEGORIES.find((c) => c.id === id);

/** Iconos que puede elegir el asistente para un módulo personalizado. */
export const CUSTOM_ICONS = [
  "wallet", "book", "drop", "moon", "sun", "heart", "sparkle", "target", "home", "users", "briefcase", "calendar",
  "clock", "bolt", "plane", "cart", "pencil", "star", "leaf", "coffee", "camera", "film", "paw", "code", "music",
  "dumbbell", "nutrition",
] as const;

/** Paleta de color de los módulos personalizados (evita los tonos de las secciones base). */
export const CUSTOM_COLORS = [
  { id: "rose", hex: "#fb7185" },
  { id: "gold", hex: "#facc15" },
  { id: "lime", hex: "#a3e635" },
  { id: "teal", hex: "#2dd4bf" },
  { id: "sky", hex: "#38bdf8" },
  { id: "indigo", hex: "#818cf8" },
  { id: "pink", hex: "#f472b6" },
  { id: "sand", hex: "#e7c9a0" },
] as const;

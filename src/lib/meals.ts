import type { MealType } from "./types";

/** Comida que toca según la hora (se puede cambiar con un toque). */
export function mealForHour(date: Date = new Date()): MealType {
  const mins = date.getHours() * 60 + date.getMinutes();
  if (mins >= 5 * 60 && mins < 10 * 60 + 30) return "Desayuno";
  if (mins >= 10 * 60 + 30 && mins < 15 * 60 + 30) return "Almuerzo";
  if (mins >= 15 * 60 + 30 && mins < 18 * 60 + 30) return "Snack";
  if (mins >= 18 * 60 + 30 && mins < 22 * 60 + 30) return "Cena";
  return "Snack";
}

export const MEAL_EMOJI: Record<MealType, string> = { Desayuno: "🍳", Almuerzo: "🍽️", Cena: "🌙", Snack: "🍪" };

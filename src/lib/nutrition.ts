import type { AppState, MacroTotals, NutritionDay } from "./types";

const EMPTY_DAY: NutritionDay = { water: 0, meals: [] };

export const dayOf = (state: AppState, key: string): NutritionDay => state.nutrition.days[key] ?? EMPTY_DAY;

export function mealTotals(state: AppState, key: string): MacroTotals {
  return dayOf(state, key).meals.reduce<MacroTotals>(
    (a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

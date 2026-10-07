import type { MacroTotals } from "./types";

/** Un alimento de la base de datos nutricional (valores por 100 g). */
export interface FoodHit {
  id: string;
  name: string;
  brand: string;
  per100: MacroTotals;
  /** Porción habitual en gramos, si el producto la indica. */
  serving: { grams: number; label: string } | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Valores para una cantidad en gramos a partir de los de 100 g. */
export function scaleMacros(per100: MacroTotals, grams: number): MacroTotals {
  const k = Math.max(0, grams) / 100;
  return { kcal: Math.round(per100.kcal * k), p: round1(per100.p * k), c: round1(per100.c * k), f: round1(per100.f * k) };
}

/** Busca alimentos (a través de /api/food). Lanza un Error con un mensaje legible. */
export async function searchFood(query: string, signal: AbortSignal): Promise<FoodHit[]> {
  const res = await fetch(`/api/food?q=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error(res.status === 429 ? "Demasiadas búsquedas seguidas. Espera un momento." : "No se pudo consultar la base de datos.");
  const data = (await res.json()) as { results?: FoodHit[] };
  return data.results ?? [];
}

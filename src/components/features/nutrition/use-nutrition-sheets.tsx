"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { MEALS } from "@/lib/constants";
import { dkey } from "@/lib/dates";
import { foodEmoji } from "@/lib/food-emoji";
import { burst } from "@/lib/fx";
import { mealForHour } from "@/lib/meals";
import { scaleMacros, type FoodHit } from "@/lib/food";
import { pick } from "@/lib/guards";
import { dayOf } from "@/lib/nutrition";
import { getState, updateState } from "@/lib/store";
import type { Meal, MealType } from "@/lib/types";
import { num, uid } from "@/lib/utils";
import { PortionField } from "./portion-field";

const mealIds = MEALS.map(([id]) => id);

const defaultMealType = (): MealType => mealForHour();

/** Hojas modales de la sección Nutrición. */
export function useNutritionSheets() {
  const { openSheet, closeSheet } = useSheet();

  return useMemo(() => {
    const remove = (key: string, id: string) => {
      updateState((d) => {
        const day = d.nutrition.days[key];
        if (day) day.meals = day.meals.filter((x) => x.id !== id);
      });
      closeSheet();
    };

    const upsert = (key: string, record: Meal, existing?: Meal) =>
      updateState((d) => {
        const day = (d.nutrition.days[key] ??= { water: 0, meals: [] });
        if (existing) day.meals = day.meals.map((x) => (x.id === existing.id ? record : x));
        else day.meals.push(record);
      });

    return {
      /** Elegir cantidad de un alimento de la base de datos (o reajustar una comida ya guardada). */
      food(food: Pick<FoodHit, "name" | "brand" | "per100" | "serving">, meal?: Meal, type?: MealType) {
        const key = dkey();
        openSheet({
          title: meal ? "Ajustar cantidad" : `${foodEmoji(food.name)} ¿Cuánto comiste?`,
          text: food.brand ? `${food.name} · ${food.brand}` : food.name,
          submit: meal ? "Guardar" : "Añadir comida",
          focus: false,
          fields: [
            { name: "grams", label: "Cantidad", type: "custom", render: () => <PortionField per100={food.per100} serving={food.serving} initial={meal?.grams ?? food.serving?.grams ?? 100} /> },
            { name: "type", label: "¿En qué momento?", type: "seg", options: MEALS, value: meal?.type ?? type ?? defaultMealType() },
          ],
          danger: meal ? { label: "Eliminar", fn: () => remove(key, meal.id) } : undefined,
          onSubmit: (v) => {
            const grams = Math.max(1, Math.min(2000, num(v.grams) || 100));
            const m = scaleMacros(food.per100, grams);
            upsert(
              key,
              { id: meal?.id ?? uid(), name: food.name, brand: food.brand || undefined, type: pick(mealIds, v.type, "Snack"), ...m, grams, per100: food.per100 },
              meal,
            );
            if (!meal) burst(foodEmoji(food.name), `+${m.kcal} kcal`);
          },
        });
      },

      /** Entrada manual: solo cuando el alimento no aparece en la base de datos. */
      meal(id?: string, type?: MealType) {
        const key = dkey();
        const meal = id ? dayOf(getState(), key).meals.find((m) => m.id === id) : undefined;
        if (meal?.per100 && meal.grams) return this.food({ name: meal.name, brand: meal.brand ?? "", per100: meal.per100, serving: null }, meal);

        openSheet({
          title: meal ? "Editar comida" : "Añadir sin buscar",
          text: meal ? undefined : "Úsalo solo si no encuentras el alimento en el buscador.",
          submit: meal ? "Guardar" : "Añadir comida",
          fields: [
            { name: "name", label: "¿Qué comiste?", type: "text", required: true, value: meal?.name ?? "", placeholder: "Ej. Pollo con arroz" },
            { name: "type", label: "Momento", type: "seg", options: MEALS, value: meal?.type ?? type ?? defaultMealType() },
            { name: "kcal", label: "Calorías (kcal)", type: "number", half: true, value: meal?.kcal ?? "" },
            { name: "p", label: "Proteína (g)", type: "number", half: true, value: meal?.p ?? "" },
            { name: "c", label: "Carbohidratos (g)", type: "number", half: true, value: meal?.c ?? "" },
            { name: "f", label: "Grasas (g)", type: "number", half: true, value: meal?.f ?? "" },
          ],
          danger: meal ? { label: "Eliminar", fn: () => remove(key, meal.id) } : undefined,
          onSubmit: (v) => {
            const p = num(v.p);
            const c = num(v.c);
            const f = num(v.f);
            // Si no pones calorías, se calculan con los macros (4-4-9).
            const kcal = num(v.kcal) || p * 4 + c * 4 + f * 9;
            upsert(key, { id: meal?.id ?? uid(), name: (v.name ?? "").trim(), type: pick(mealIds, v.type, "Snack"), kcal, p, c, f }, meal);
            if (!meal) burst(foodEmoji(v.name ?? ""), `+${Math.round(kcal)} kcal`);
          },
        });
      },

      goals() {
        const g = getState().nutrition.goals;
        openSheet({
          title: "Metas diarias",
          submit: "Guardar",
          focus: false,
          fields: [
            { name: "kcal", label: "Calorías (kcal)", type: "number", half: true, value: g.kcal },
            { name: "water", label: "Agua (ml)", type: "number", half: true, value: g.water },
            { name: "p", label: "Proteína (g)", type: "number", half: true, value: g.p },
            { name: "c", label: "Carbohidratos (g)", type: "number", half: true, value: g.c },
            { name: "f", label: "Grasas (g)", type: "number", half: true, value: g.f },
          ],
          onSubmit: (v) => {
            const n = (value: string | undefined, fallback: number) => Math.max(1, Math.round(num(value)) || fallback);
            updateState((d) => {
              d.nutrition.goals = { kcal: n(v.kcal, 2400), water: n(v.water, 3000), p: n(v.p, 160), c: n(v.c, 260), f: n(v.f, 70) };
            });
          },
        });
      },
    };
  }, [openSheet, closeSheet]);
}

"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { MEALS } from "@/lib/constants";
import { dkey } from "@/lib/dates";
import { pick } from "@/lib/guards";
import { dayOf } from "@/lib/nutrition";
import { getState, updateState } from "@/lib/store";
import type { Meal } from "@/lib/types";
import { num, uid } from "@/lib/utils";

const mealIds = MEALS.map(([id]) => id);

const defaultMealType = () => {
  const h = new Date().getHours();
  return h < 10 ? "Desayuno" : h < 15 ? "Almuerzo" : h < 20 ? "Snack" : "Cena";
};

/** Hojas modales de la sección Nutrición. */
export function useNutritionSheets() {
  const { openSheet, closeSheet } = useSheet();

  return useMemo(
    () => ({
      meal(id?: string) {
        const key = dkey();
        const meal = id ? dayOf(getState(), key).meals.find((m) => m.id === id) : undefined;

        openSheet({
          title: meal ? "Editar comida" : "Nueva comida",
          submit: meal ? "Guardar" : "Añadir comida",
          fields: [
            { name: "name", label: "¿Qué comiste?", type: "text", required: true, value: meal?.name ?? "", placeholder: "Ej. Pollo con arroz" },
            { name: "type", label: "Momento", type: "seg", options: MEALS, value: meal?.type ?? defaultMealType() },
            { name: "kcal", label: "Calorías (kcal)", type: "number", half: true, value: meal?.kcal ?? "" },
            { name: "p", label: "Proteína (g)", type: "number", half: true, value: meal?.p ?? "" },
            { name: "c", label: "Carbohidratos (g)", type: "number", half: true, value: meal?.c ?? "" },
            { name: "f", label: "Grasas (g)", type: "number", half: true, value: meal?.f ?? "" },
          ],
          danger: meal
            ? {
                label: "Eliminar",
                fn: () => {
                  updateState((d) => {
                    const day = d.nutrition.days[key];
                    if (day) day.meals = day.meals.filter((x) => x.id !== meal.id);
                  });
                  closeSheet();
                },
              }
            : undefined,
          onSubmit: (v) => {
            const p = num(v.p);
            const c = num(v.c);
            const f = num(v.f);
            // Si no pones calorías, se calculan con los macros (4-4-9).
            const kcal = num(v.kcal) || p * 4 + c * 4 + f * 9;
            const record: Meal = { id: meal?.id ?? uid(), name: (v.name ?? "").trim(), type: pick(mealIds, v.type, "Snack"), kcal, p, c, f };
            updateState((d) => {
              const day = (d.nutrition.days[key] ??= { water: 0, meals: [] });
              if (meal) day.meals = day.meals.map((x) => (x.id === meal.id ? record : x));
              else day.meals.push(record);
            });
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
    }),
    [openSheet, closeSheet],
  );
}

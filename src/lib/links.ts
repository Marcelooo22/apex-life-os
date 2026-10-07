import type { Draft } from "immer";
import { gymDays } from "./gym";
import type { AppState } from "./types";

/**
 * Sincroniza los hábitos vinculados con lo que ocurre en otras secciones:
 *  - "gym": se marca cada día que hay un entreno (registrado o marcado en el calendario).
 *  - "water": se marca cada día que se alcanza la meta de agua.
 * Solo añade o quita los días que puso él mismo (`auto`); lo que marques a mano nunca se toca.
 */
export function reconcileLinks(d: Draft<AppState>) {
  const linked = d.habits.list.filter((h) => h.link === "gym" || h.link === "water");
  if (!linked.length) return;

  const sources: Record<"gym" | "water", Set<string>> = {
    gym: gymDays(d.gym),
    water: new Set(
      Object.entries(d.nutrition.days)
        .filter(([, day]) => day.water >= d.nutrition.goals.water && d.nutrition.goals.water > 0)
        .map(([key]) => key),
    ),
  };

  for (const h of linked) {
    const source = sources[h.link as "gym" | "water"];
    for (const key of source) {
      if (!h.log[key]) {
        h.log[key] = true;
        (h.auto ??= {})[key] = true;
      }
    }
    if (h.auto) {
      for (const key of Object.keys(h.auto)) {
        if (!source.has(key)) {
          delete h.log[key];
          delete h.auto[key];
        }
      }
    }
  }
}

export const LINK_LABEL = {
  none: "Manual",
  gym: "Al terminar un entreno",
  water: "Al cumplir la meta de agua",
} as const;

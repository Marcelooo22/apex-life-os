"use client";

import { useCallback } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { ALL_DAYS, HABIT_CATEGORIES, SLOTS } from "@/lib/constants";
import { dkey } from "@/lib/dates";
import { pick } from "@/lib/guards";
import { LINK_LABEL } from "@/lib/links";
import { getState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { Habit, HabitCategory, HabitLink } from "@/lib/types";
import { uid } from "@/lib/utils";

const slotIds = SLOTS.map(([slot]) => slot);
const categoryIds = HABIT_CATEGORIES.map((c) => c.id);
const linkIds = Object.keys(LINK_LABEL) as HabitLink[];

/** Pide permiso para avisar a la hora del recordatorio (se llama desde un toque del usuario). */
function askNotifications() {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  } catch {
    /* no soportado */
  }
}

/** Hoja para crear o editar un hábito: nombre, categoría, días, hora y vínculo automático. */
export function useHabitSheet() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useCallback(
    (id?: string, preset?: Partial<Omit<Habit, "id" | "log" | "created">>) => {
      const habit = id ? getState().habits.list.find((h) => h.id === id) : undefined;
      const base = habit ?? preset;

      openSheet({
        title: habit ? "Editar hábito" : "Nuevo hábito",
        submit: habit ? "Guardar" : "Crear hábito",
        fields: [
          { name: "name", label: "Nombre", type: "text", required: true, value: base?.name ?? "", placeholder: "Ej. Leer 10 páginas" },
          { name: "category", label: "Categoría", type: "choice", options: HABIT_CATEGORIES.map((c) => [c.id, c.label, c.icon] as const), value: base?.category ?? "health" },
          { name: "days", label: "Días de la semana", type: "days", value: (base?.days ?? ALL_DAYS).join(",") },
          { name: "reminder", label: "Recordatorio diario", type: "time", value: base?.reminder ?? "", clearLabel: "Sin recordatorio" },
          { name: "slot", label: "Momento del día", type: "seg", options: SLOTS, value: base?.slot ?? "morning" },
          { name: "link", label: "Se marca solo", type: "select", options: linkIds.map((l) => [l, LINK_LABEL[l]] as const), value: base?.link ?? "none" },
        ],
        danger: habit
          ? {
              label: "Eliminar",
              fn: () => {
                closeSheet();
                confirm("¿Eliminar hábito?", `"${habit.name}" y su historial se borrarán.`, "Eliminar", () => {
                  updateState((d) => {
                    d.habits.list = d.habits.list.filter((h) => h.id !== habit.id);
                  });
                });
              },
            }
          : undefined,
        onSubmit: (v) => {
          const name = (v.name ?? "").trim();
          const days = [...new Set((v.days ?? "").split(",").filter(Boolean).map(Number))].filter((d) => d >= 0 && d <= 6).sort();
          if (!days.length) {
            toast("Elige al menos un día");
            return false;
          }
          const fields = {
            name,
            slot: pick(slotIds, v.slot, "morning"),
            category: pick<HabitCategory>(categoryIds, v.category, "health"),
            days: days.length === 7 ? undefined : days,
            reminder: /^\d{2}:\d{2}$/.test(v.reminder ?? "") ? v.reminder : "",
            link: pick<HabitLink>(linkIds, v.link, "none"),
          };
          if (fields.reminder) askNotifications();
          updateState((d) => {
            if (habit) {
              const target = d.habits.list.find((h) => h.id === habit.id);
              if (target) Object.assign(target, fields);
            } else {
              d.habits.list.push({ id: uid(), created: dkey(), log: {}, ...fields });
            }
          });
        },
      });
    },
    [openSheet, closeSheet, confirm],
  );
}

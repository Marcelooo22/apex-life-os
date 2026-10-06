"use client";

import { useCallback } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { SLOTS } from "@/lib/constants";
import { dkey } from "@/lib/dates";
import { pick } from "@/lib/guards";
import { getState, updateState } from "@/lib/store";
import { uid } from "@/lib/utils";

/** Hoja para crear o editar un hábito. */
export function useHabitSheet() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useCallback(
    (id?: string) => {
      const habit = id ? getState().habits.list.find((h) => h.id === id) : undefined;
      const slotIds = SLOTS.map(([slot]) => slot);

      openSheet({
        title: habit ? "Editar hábito" : "Nuevo hábito",
        submit: habit ? "Guardar" : "Crear hábito",
        fields: [
          { name: "name", label: "Nombre", type: "text", required: true, value: habit?.name ?? "", placeholder: "Ej. Leer 10 páginas" },
          { name: "slot", label: "Momento del día", type: "seg", options: SLOTS, value: habit?.slot ?? "morning" },
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
          const slot = pick(slotIds, v.slot, "morning");
          updateState((d) => {
            if (habit) {
              const target = d.habits.list.find((h) => h.id === habit.id);
              if (target) {
                target.name = name;
                target.slot = slot;
              }
            } else {
              d.habits.list.push({ id: uid(), name, slot, created: dkey(), log: {} });
            }
          });
        },
      });
    },
    [openSheet, closeSheet, confirm],
  );
}

"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { dkey } from "@/lib/dates";
import { pick } from "@/lib/guards";
import { getState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { BodyEntry, BodyGoal, Sex } from "@/lib/types";
import { num, uid } from "@/lib/utils";

const GOALS: readonly (readonly [BodyGoal, string])[] = [
  ["", "Sin definir"],
  ["muscle", "Ganar músculo"],
  ["fat", "Perder grasa"],
  ["strength", "Fuerza"],
  ["health", "Salud"],
];
const opt = (v: string | undefined, min: number, max: number) => {
  const n = num(v);
  return v?.trim() && n >= min && n <= max ? Math.round(n * 10) / 10 : undefined;
};

/** Hojas de "Mi cuerpo": perfil y mediciones. Todo es opcional salvo el peso al registrar. */
export function useBodySheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(
    () => ({
      profile() {
        const p = getState().gym.profile;
        openSheet({
          title: "Tu perfil",
          text: "Solo se guarda en tu cuenta. Sirve para ajustar el mapa del cuerpo y calcular tu IMC.",
          submit: "Guardar",
          focus: false,
          fields: [
            { name: "sex", label: "Cuerpo del mapa y las guías", type: "seg", options: [["male", "Hombre"], ["female", "Mujer"], ["", "Prefiero no decir"]], value: p.sex },
            { name: "height", label: "Altura (cm)", type: "number", half: true, value: p.height || "", placeholder: "170" },
            { name: "goal", label: "Objetivo", type: "select", half: true, options: GOALS, value: p.goal },
          ],
          onSubmit: (v) => {
            const height = opt(v.height, 100, 230);
            updateState((d) => {
              d.gym.profile.sex = pick<Sex>(["male", "female", ""], v.sex, "");
              d.gym.profile.height = height ?? "";
              d.gym.profile.goal = pick<BodyGoal>(["", "muscle", "fat", "strength", "health"], v.goal, "");
            });
          },
        });
      },

      /** Pregunta y elimina una medición (se puede llamar desde la lista, sin hoja abierta). */
      remove(id: string) {
        confirm("¿Eliminar medición?", "Se borra de tu historial. Luego puedes registrar otra.", "Eliminar", () => {
          updateState((d) => {
            d.gym.body = d.gym.body.filter((b) => b.id !== id);
          });
          toast("Medición eliminada");
        });
      },

      /** Registrar o editar una medición. */
      entry(id?: string) {
        const { body, profile } = getState().gym;
        const entry = id ? body.find((b) => b.id === id) : undefined;
        const last = [...body].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
        openSheet({
          title: entry ? "Editar medición" : "Registrar medidas",
          text: entry ? `Medición del ${entry.date}. Puedes cambiar cualquier dato o eliminarla.` : "Con el peso basta. El resto es opcional.",
          submit: "Guardar",
          fields: [
            { name: "weight", label: "Peso (kg)", type: "number", required: true, half: true, value: entry?.weight ?? last?.weight ?? "", placeholder: "70" },
            { name: "date", label: "Fecha", type: "date", half: true, value: entry?.date ?? dkey() },
            { name: "fat", label: "% de grasa", type: "number", half: true, value: entry?.fat ?? "", placeholder: "Opcional" },
            { name: "muscle", label: "% de músculo", type: "number", half: true, value: entry?.muscle ?? "", placeholder: "Opcional" },
            { name: "waist", label: "Cintura (cm)", type: "number", half: true, value: entry?.waist ?? "", placeholder: "Opcional" },
            ...(profile.height ? [] : ([{ name: "height", label: "Altura (cm)", type: "number", half: true, value: "", placeholder: "Para el IMC" }] as const)),
          ],
          danger: entry
            ? {
                label: "Eliminar",
                fn: () => {
                  // Primero se cierra esta hoja y luego se abre la confirmación (al revés, se cerraba al instante).
                  closeSheet(true);
                  setTimeout(() => this.remove(entry.id), 60);
                },
              }
            : undefined,
          onSubmit: (v) => {
            const weight = opt(v.weight, 20, 400);
            if (!weight) {
              toast("Escribe un peso válido en kg");
              return false;
            }
            const record: BodyEntry = {
              id: entry?.id ?? uid(),
              date: /^\d{4}-\d{2}-\d{2}$/.test(v.date ?? "") ? (v.date as string) : dkey(),
              weight,
              fat: opt(v.fat, 2, 70),
              muscle: opt(v.muscle, 10, 80),
              waist: opt(v.waist, 40, 200),
            };
            const height = opt(v.height, 100, 230);
            if (entry) toast("Medición actualizada");
            updateState((d) => {
              const i = entry ? d.gym.body.findIndex((b) => b.id === entry.id) : -1;
              if (i >= 0) d.gym.body[i] = record;
              else d.gym.body.push(record);
              if (height && !d.gym.profile.height) d.gym.profile.height = height;
            });
          },
        });
      },
    }),
    [openSheet, closeSheet, confirm],
  );
}

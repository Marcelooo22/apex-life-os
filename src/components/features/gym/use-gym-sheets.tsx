"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { dayLabel } from "@/lib/dates";
import { exerciseLibrary, newExercise, sessionVolume } from "@/lib/gym";
import { pick } from "@/lib/guards";
import { getState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import { fmt, num } from "@/lib/utils";

/** Hojas modales de la sección Gym. */
export function useGymSheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(
    () => ({
      addSplit(onCreated: (name: string) => void) {
        openSheet({
          title: "Nueva división",
          submit: "Crear",
          fields: [{ name: "name", label: "Nombre", type: "text", required: true, placeholder: "Ej. Brazos" }],
          onSubmit: (v) => {
            const name = (v.name ?? "").trim();
            if (getState().gym.routines[name]) {
              toast("Esa división ya existe");
              return false;
            }
            updateState((d) => {
              d.gym.routines[name] = [];
            });
            onCreated(name);
          },
        });
      },

      editRoutine(split: string) {
        const { routines } = getState().gym;
        openSheet({
          title: `Ejercicios de ${split}`,
          submit: "Guardar",
          text: "Un ejercicio por línea, en el orden en que los haces.",
          fields: [{ name: "list", label: "Ejercicios", type: "textarea", value: (routines[split] ?? []).join("\n") }],
          danger:
            Object.keys(routines).length > 1
              ? {
                  label: "Eliminar división",
                  fn: () => {
                    updateState((d) => {
                      delete d.gym.routines[split];
                    });
                    closeSheet();
                  },
                }
              : undefined,
          onSubmit: (v) => {
            const list = (v.list ?? "")
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean);
            updateState((d) => {
              d.gym.routines[split] = list;
            });
          },
        });
      },

      addExercise() {
        openSheet({
          title: "Añadir ejercicio",
          submit: "Añadir",
          fields: [
            {
              name: "name",
              label: "Ejercicio",
              type: "text",
              required: true,
              placeholder: "Escribe o elige uno",
              list: exerciseLibrary(getState().gym),
            },
          ],
          onSubmit: (v) => {
            const exercise = newExercise(getState().gym, v.name ?? "");
            updateState((d) => {
              d.gym.active?.exercises.push(exercise);
            });
          },
        });
      },

      settings() {
        const g = getState().gym;
        openSheet({
          title: "Ajustes del gym",
          submit: "Guardar",
          focus: false,
          fields: [
            { name: "rest", label: "Descanso entre series (segundos)", type: "number", value: g.rest },
            { name: "goal", label: "Meta de días por semana", type: "number", value: g.goal },
            { name: "effort", label: "Esfuerzo percibido", type: "seg", options: [["RPE", "RPE"], ["RIR", "RIR"]], value: g.effort },
          ],
          onSubmit: (v) => {
            updateState((d) => {
              d.gym.rest = Math.max(10, Math.round(num(v.rest)) || 90);
              d.gym.goal = Math.min(7, Math.max(1, Math.round(num(v.goal)) || 4));
              d.gym.effort = pick(["RPE", "RIR"], v.effort, "RPE");
            });
          },
        });
      },

      session(id: string) {
        const gym = getState().gym;
        const s = gym.sessions.find((x) => x.id === id);
        if (!s) return;
        const prs = s.prs ?? [];
        openSheet({
          title: `${s.split}, ${dayLabel(s.date)}`,
          theme: "gym",
          focus: false,
          text: `${fmt(sessionVolume(s))} kg de volumen en ${s.mins} min${prs.length ? `. Récord en ${prs.join(", ")}.` : ""}`,
          children: s.exercises.map((e) => (
            <div className="sx-ex" key={e.name}>
              <b>{e.name}</b>
              {e.sets.map((x, i) => (
                <span key={i}>
                  {i + 1}. {x.kg} kg × {x.reps}
                  {x.rpe ? ` (${gym.effort || "RPE"} ${x.rpe})` : ""}
                </span>
              ))}
            </div>
          )),
          danger: {
            label: "Eliminar entreno",
            fn: () => {
              closeSheet();
              confirm("¿Eliminar entreno?", "Se borra del historial y del calendario.", "Eliminar", () => {
                updateState((d) => {
                  d.gym.sessions = d.gym.sessions.filter((x) => x.id !== id);
                });
              });
            },
          },
        });
      },
    }),
    [openSheet, closeSheet, confirm],
  );
}

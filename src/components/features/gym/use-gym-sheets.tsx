"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { dayLabel } from "@/lib/dates";
import { findExercise, ZONE_LABEL, type Zone } from "@/lib/exercises";
import { newExercise, sessionVolume } from "@/lib/gym";
import { pick } from "@/lib/guards";
import { PROGRAMS, type Program } from "@/lib/presets";
import { fmtRest, REST_PRESETS } from "@/lib/rest-timer";
import { getState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import { cn, fmt, num } from "@/lib/utils";
import { AnatomyLazy } from "@/components/ui/anatomy-lazy";
import { ExerciseViewer } from "./exercise-viewer";
import { ExercisePicker, parsePicks } from "./exercise-picker";

/** Hojas modales de la sección Gym. */
export function useGymSheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(() => {
    /** Añade las divisiones de un programa sin pisar las que ya tienes. */
    const applyProgram = (p: Program) => {
      let added = 0;
      updateState((d) => {
        for (const [name, list] of Object.entries(p.splits)) {
          const same = Object.entries(d.gym.routines).some(([, l]) => l.join("|") === list.join("|"));
          if (same) continue;
          let final = name;
          let n = 2;
          while (d.gym.routines[final]) final = `${name} ${n++}`;
          d.gym.routines[final] = [...list];
          added++;
        }
        d.gym.goal = Math.min(7, p.days);
      });
      toast(added ? `${p.name}: ${added} ${added === 1 ? "rutina añadida" : "rutinas añadidas"}. Meta semanal: ${p.days} días` : "Ya tenías esas rutinas");
    };

    return {
      /** Elegir un programa prehecho. */
      programs() {
        openSheet({
          title: "Elige un programa",
          text: "Se añade a tus rutinas; puedes cambiar cualquier ejercicio después. Si dudas, empieza por «Cuerpo completo».",
          focus: false,
          children: (
            <div className="prog-list">
              {PROGRAMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="prog"
                  onClick={() => {
                    applyProgram(p);
                    closeSheet();
                  }}
                >
                  <span className="prog-h">
                    <strong>{p.name}</strong>
                    <small>
                      {p.days} días · {p.level}
                    </small>
                  </span>
                  <span className="prog-b">{p.blurb}</span>
                  <span className="prog-s">{Object.keys(p.splits).join(" · ")}</span>
                </button>
              ))}
            </div>
          ),
        });
      },

      addSplit(onCreated: (name: string) => void) {
        openSheet({
          title: "Nueva rutina",
          submit: "Crear",
          fields: [{ name: "name", label: "Nombre", type: "text", required: true, placeholder: "Ej. Brazos, Día 1, Lunes" }],
          onSubmit: (v) => {
            const name = (v.name ?? "").trim();
            if (getState().gym.routines[name]) {
              toast("Ya tienes una rutina con ese nombre");
              return false;
            }
            updateState((d) => {
              d.gym.routines[name] = [];
            });
            onCreated(name);
          },
        });
      },

      /** Editar los ejercicios de una rutina con el selector. */
      editRoutine(split: string) {
        const { routines } = getState().gym;
        openSheet({
          title: `Ejercicios de ${split}`,
          submit: "Guardar",
          fields: [{ name: "picks", label: "Elige los ejercicios", type: "custom", render: () => <ExercisePicker name="picks" initial={routines[split] ?? []} /> }],
          focus: false,
          danger:
            Object.keys(routines).length > 1
              ? {
                  label: "Eliminar rutina",
                  fn: () => {
                    updateState((d) => {
                      delete d.gym.routines[split];
                    });
                    closeSheet();
                  },
                }
              : undefined,
          onSubmit: (v) => {
            const list = parsePicks(v.picks);
            updateState((d) => {
              d.gym.routines[split] = list;
            });
          },
        });
      },

      /** Añadir ejercicios al entreno en curso. */
      addExercise() {
        const current = getState().gym.active?.exercises.map((e) => e.name) ?? [];
        openSheet({
          title: "Añadir ejercicios",
          submit: "Añadir al entreno",
          focus: false,
          fields: [{ name: "picks", label: "Elige uno o varios", type: "custom", render: () => <ExercisePicker name="picks" initial={[]} /> }],
          onSubmit: (v) => {
            const names = parsePicks(v.picks).filter((n) => !current.some((c) => c.toLowerCase() === n.toLowerCase()));
            if (!names.length) return;
            const gym = getState().gym;
            const created = names.map((n) => newExercise(gym, n));
            updateState((d) => {
              d.gym.active?.exercises.push(...created);
            });
          },
        });
      },

      /** Cómo se hace un ejercicio, con el cuerpo marcado. */
      help(name: string) {
        const ex = findExercise(name);
        const sex = getState().gym.profile.sex;
        const fills: Partial<Record<Zone, string>> = {};
        ex?.zones.forEach((z, i) => (fills[z] = i === 0 ? "#ef5350" : "#f5a524"));
        openSheet({
          title: name,
          text: ex ? `${ex.equip} · ${ex.zones.map((z) => ZONE_LABEL[z]).join(", ")}` : "No tengo la guía de este ejercicio todavía.",
          focus: false,
          children: ex ? (
            <div className="help">
              <ExerciseViewer exerciseId={ex.id} />
              <div className="help-bm">
                <AnatomyLazy sex={sex} fills={fills} label={`Músculos que trabaja: ${ex.zones.map((z) => ZONE_LABEL[z]).join(", ")}`} />
              </div>
              <ol className="help-steps">
                {ex.how.map((step, i) => (
                  <li key={i}>
                    <span>{["Posición", "Movimiento", "Cuida esto"][i]}</span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="muted help-n">Empieza con poco peso hasta dominar la técnica. Si sientes dolor (no cansancio), para y consulta a un entrenador.</p>
            </div>
          ) : (
            <p className="muted">Pide a un entrenador que te lo enseñe o pregúntale al coach del gym.</p>
          ),
        });
      },

      /** Elegir el descanso por defecto sin empezar ningún cronómetro. */
      rest() {
        const current = getState().gym.rest;
        openSheet({
          title: "Descanso entre series",
          text: "Se usa cuando completas una serie. Puedes cambiarlo en cualquier momento.",
          focus: false,
          children: (
            <div className="chips rest-pick">
              {REST_PRESETS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  className={cn("chip", current === sec && "on")}
                  onClick={() => {
                    updateState((d) => {
                      d.gym.rest = sec;
                    });
                    closeSheet();
                  }}
                >
                  {fmtRest(sec)}
                </button>
              ))}
            </div>
          ),
        });
      },

      settings() {
        const g = getState().gym;
        openSheet({
          title: "Ajustes del gym",
          submit: "Guardar",
          focus: false,
          fields: [
            { name: "rest", label: "Descanso entre series (segundos)", type: "number", half: true, value: g.rest },
            { name: "goal", label: "Meta de días por semana", type: "number", half: true, value: g.goal },
            { name: "autoRest", label: "Iniciar el descanso solo", type: "seg", options: [["1", "Sí"], ["0", "No"]], value: g.autoRest === false ? "0" : "1" },
            { name: "showEffort", label: "Anotar el esfuerzo (RPE)", type: "seg", options: [["0", "No"], ["1", "Sí"]], value: g.showEffort ? "1" : "0" },
            { name: "effort", label: "Escala de esfuerzo", type: "seg", options: [["RPE", "RPE"], ["RIR", "RIR"]], value: g.effort },
          ],
          onSubmit: (v) => {
            updateState((d) => {
              d.gym.rest = Math.max(10, Math.round(num(v.rest)) || 90);
              d.gym.goal = Math.min(7, Math.max(1, Math.round(num(v.goal)) || 4));
              d.gym.autoRest = v.autoRest !== "0";
              d.gym.showEffort = v.showEffort === "1";
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
    };
  }, [openSheet, closeSheet, confirm]);
}

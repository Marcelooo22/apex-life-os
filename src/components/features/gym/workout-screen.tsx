"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useSheet } from "@/components/ui/sheet-provider";
import { useAppState } from "@/hooks/use-app-state";
import { useWorkoutFocus } from "@/hooks/use-workout-focus";
import { AnatomyLazy } from "@/components/ui/anatomy-lazy";
import { ZONE_LABEL, findExercise, type Zone } from "@/lib/exercises";
import { closeWorkout } from "@/lib/focus";
import { fmtRest } from "@/lib/rest-timer";
import { toast } from "@/lib/toast";
import type { ActiveWorkout, GymState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Elapsed } from "./active-workout-card";
import { ExerciseCard } from "./exercise-card";
import { ExerciseViewer } from "./exercise-viewer";
import { useGymSheets } from "./use-gym-sheets";
import { discardWorkout, finishWorkout } from "./workout-actions";

const MODEL_KEY = "apex.wk.model";

function Screen({ workout, gym }: { workout: ActiveWorkout; gym: GymState }) {
  const sheets = useGymSheets();
  const { confirm } = useSheet();
  const firstPending = workout.exercises.find((e) => !e.sets.every((s) => s.done))?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(firstPending);
  const [model, setModel] = useState(() => {
    try {
      return localStorage.getItem(MODEL_KEY) !== "0";
    } catch {
      return true;
    }
  });
  const done = workout.exercises.filter((e) => e.sets.length && e.sets.every((s) => s.done)).length;

  const toggleModel = () => {
    setModel((m) => {
      try {
        localStorage.setItem(MODEL_KEY, m ? "0" : "1");
      } catch {
        /* sin almacenamiento */
      }
      return !m;
    });
  };

  const advance = (fromId: string) => {
    const list = workout.exercises;
    const i = list.findIndex((e) => e.id === fromId);
    const next = [...list.slice(i + 1), ...list.slice(0, i)].find((e) => !e.sets.every((s) => s.done));
    setOpenId(next?.id ?? null);
    if (!next) toast("Completaste todos los ejercicios. Cuando quieras, pulsa Terminar");
  };

  const current = workout.exercises.find((e) => e.id === openId) ?? workout.exercises.find((e) => !e.sets.every((s) => s.done));
  const known = current ? findExercise(current.name) : undefined;
  const fills: Partial<Record<Zone, string>> = {};
  known?.zones.forEach((z, i) => (fills[z] = i === 0 ? "#ef5350" : "#f5a524"));

  return (
    <div className="wkr" role="dialog" aria-label="Entrenamiento en curso">
      <div className="wk-in">
        <header className="wk-top">
          <button type="button" className="pill" onClick={closeWorkout}>
            <Icon name="back" /> Minimizar
          </button>
          <div className="wk-title">
            <b>{workout.split}</b>
            <Elapsed start={workout.start} />
          </div>
          <button type="button" className="btn primary sm" onClick={finishWorkout}>
            Terminar
          </button>
        </header>

        <div className="wk-prog" role="tablist" aria-label="Ejercicios">
          {workout.exercises.map((e, i) => {
            const all = e.sets.length > 0 && e.sets.every((s) => s.done);
            return (
              <button key={e.id} type="button" role="tab" aria-selected={openId === e.id} aria-label={`${i + 1}. ${e.name}`} className={cn("wk-dot", all && "done", openId === e.id && "on")} onClick={() => setOpenId(e.id)} />
            );
          })}
          <span className="muted">
            {done}/{workout.exercises.length}
          </span>
        </div>

        {current && (
          <section className="wk-model card">
            <div className="wk-mh">
              <div>
                <span className="muted">Ahora</span>
                <h2>{current.name}</h2>
              </div>
              <button type="button" className="btn quiet sm" onClick={toggleModel} aria-expanded={model}>
                {model ? "Ocultar" : "Ver modelo"}
              </button>
            </div>
            {model && (
              <ExerciseViewer
                exerciseId={known?.id}
                fallback={
                  known ? (
                    <AnatomyLazy sex={gym.profile.sex} fills={fills} label={`Músculos que trabaja: ${known.zones.map((z) => ZONE_LABEL[z]).join(", ")}`} />
                  ) : (
                    <p className="muted">Este ejercicio es tuyo y no tiene modelo. Registra tus series abajo.</p>
                  )
                }
              />
            )}
            {known && (
              <button type="button" className="btn quiet sm wk-how" onClick={() => sheets.help(current.name)}>
                Ver pasos de la técnica
              </button>
            )}
          </section>
        )}

        <section className="card wk-list">
          {workout.exercises.length ? (
            workout.exercises.map((ex, i) => (
              <ExerciseCard key={ex.id} exercise={ex} gym={gym} index={i} open={openId === ex.id} onOpen={() => setOpenId(openId === ex.id ? null : ex.id)} onComplete={() => advance(ex.id)} />
            ))
          ) : (
            <div className="empty">Añade tu primer ejercicio para empezar a registrar series.</div>
          )}
          <button type="button" className="btn ghost big gap" onClick={sheets.addExercise}>
            <Icon name="plus" /> Añadir ejercicios
          </button>
        </section>

        <div className="wk-foot">
          <button type="button" className="chip" onClick={sheets.rest}>
            Descanso {fmtRest(gym.rest)}
          </button>
          <button type="button" className="btn quiet" onClick={() => confirm("¿Descartar entreno?", "Se pierden las series registradas en esta sesión.", "Descartar", discardWorkout)}>
            Descartar entreno
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pantalla completa del entreno: sin calendario ni récords, solo el ejercicio actual. */
export function WorkoutScreen() {
  const { gym } = useAppState();
  const focus = useWorkoutFocus();
  if (!gym.active || !focus) return null;
  return <Screen workout={gym.active} gym={gym} />;
}

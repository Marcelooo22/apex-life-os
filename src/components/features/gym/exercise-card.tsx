"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { InfoTip } from "@/components/ui/info-tip";
import { useSheet } from "@/components/ui/sheet-provider";
import { findExercise } from "@/lib/exercises";
import { lastSets } from "@/lib/gym";
import { startRest } from "@/lib/rest-timer";
import { getState, updateState } from "@/lib/store";
import type { ActiveExercise, GymState } from "@/lib/types";
import { cn, haptic } from "@/lib/utils";
import { useGymSheets } from "./use-gym-sheets";

type SetField = "kg" | "reps" | "rpe";
const AUTO_DELAY = 900;

interface Props {
  exercise: ActiveExercise;
  gym: GymState;
  index: number;
  open: boolean;
  onOpen: () => void;
  /** Se llama cuando se completan todas las series. */
  onComplete: () => void;
}

/**
 * Un ejercicio del entreno. Cerrado muestra solo el avance; abierto, sus series.
 * Una serie se da por hecha sola cuando rellenas peso y repeticiones (o solo repeticiones en ejercicios con tu peso corporal).
 */
export function ExerciseCard({ exercise, gym, index, open, onOpen, onComplete }: Props) {
  const { confirm } = useSheet();
  const sheets = useGymSheets();
  const known = findExercise(exercise.name);
  const effort = gym.effort || "RPE";
  const effortOn = gym.showEffort === true;
  const previous = lastSets(gym, exercise.name);
  const bodyweight = known?.bw ?? (previous.length > 0 && previous.every((s) => !s.kg));
  const doneCount = exercise.sets.filter((s) => s.done).length;
  const allDone = doneCount === exercise.sets.length && exercise.sets.length > 0;
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const edit = (recipe: (ex: ActiveExercise) => void) =>
    updateState((d) => {
      const ex = d.gym.active?.exercises.find((e) => e.id === exercise.id);
      if (ex) recipe(ex);
    });

  const finishSet = (i: number) => {
    haptic(12);
    if (getState().gym.autoRest !== false) startRest(getState().gym.rest);
    const ex = getState().gym.active?.exercises.find((e) => e.id === exercise.id);
    if (ex && ex.sets.every((s) => s.done)) setTimeout(onComplete, 500);
    void i;
  };

  /** Pasado un instante sin escribir, si la serie está completa, se marca sola. */
  const scheduleAuto = (i: number) => {
    clearTimeout(timers.current.get(i));
    timers.current.set(
      i,
      setTimeout(() => {
        const ex = getState().gym.active?.exercises.find((e) => e.id === exercise.id);
        const set = ex?.sets[i];
        if (!set) return;
        const filled = set.reps.trim() !== "" && (set.kg.trim() !== "" || bodyweight);
        if (filled && !set.done) {
          edit((e) => {
            const s = e.sets[i];
            if (s) s.done = true;
          });
          finishSet(i);
        } else if (!filled && set.done && set.reps.trim() === "") {
          edit((e) => {
            const s = e.sets[i];
            if (s) s.done = false;
          });
        }
      }, AUTO_DELAY),
    );
  };

  const setValue = (i: number, field: SetField, value: string) => {
    edit((ex) => {
      const set = ex.sets[i];
      if (set) set[field] = value;
    });
    if (field !== "rpe") scheduleAuto(i);
  };

  const toggleDone = (i: number) => {
    clearTimeout(timers.current.get(i));
    const willBeDone = !exercise.sets[i]?.done;
    const prev = previous[i];
    edit((ex) => {
      const set = ex.sets[i];
      if (!set) return;
      set.done = willBeDone;
      if (willBeDone) {
        if (set.kg === "" && prev && !bodyweight) set.kg = prev.kg;
        if (set.reps === "" && prev) set.reps = prev.reps;
      }
    });
    if (willBeDone) finishSet(i);
  };

  const remove = () =>
    confirm("¿Quitar ejercicio?", "Se descartan sus series de este entreno.", "Quitar", () => {
      updateState((d) => {
        if (d.gym.active) d.gym.active.exercises = d.gym.active.exercises.filter((e) => e.id !== exercise.id);
      });
    });

  const summary = previous.length ? `Última vez: ${previous.map((s) => (s.kg ? `${s.kg}×${s.reps}` : `${s.reps} reps`)).join("  ")}` : "Primera vez con este ejercicio";

  return (
    <div className={cn("ex", open && "open", allDone && "all-done")}>
      <button type="button" className="ex-bar" onClick={onOpen} aria-expanded={open}>
        <span className="ex-n">{allDone ? <Icon name="check" /> : index + 1}</span>
        <span className="ex-t">
          <strong>{exercise.name}</strong>
          <small>
            {doneCount}/{exercise.sets.length} series{!open && previous.length ? ` · ${previous[0]?.kg ? previous[0].kg + " kg" : previous[0]?.reps + " reps"} la última vez` : ""}
          </small>
        </span>
        <Icon name="chevron" className="ex-chev" />
      </button>
      {open && (
        <div className="ex-body">
          <div className="ex-tools">
            <span className="prev muted">{summary}</span>
            <button type="button" className="btn quiet sm" onClick={() => sheets.help(exercise.name)}>
              ¿Cómo se hace?
            </button>
          </div>
          <div className={cn("set-h", !effortOn && "no-effort")}>
            <span>
              Serie <InfoTip term="serie" />
            </span>
            <span>
              {bodyweight ? "kg extra" : "kg"} <InfoTip term="kg" />
            </span>
            <span>
              Reps <InfoTip term="reps" />
            </span>
            {effortOn && (
              <span>
                {effort} <InfoTip term={effort.toLowerCase()} />
              </span>
            )}
            <span />
          </div>
          {exercise.sets.map((s, i) => (
            <div className={cn("set", s.done && "done", !effortOn && "no-effort")} key={i}>
              <span className="n">{i + 1}</span>
              <input className="in" inputMode="decimal" value={s.kg} placeholder={previous[i]?.kg ?? (bodyweight ? "0" : "")} aria-label={`Peso en kg, serie ${i + 1}`} onChange={(e) => setValue(i, "kg", e.target.value)} />
              <input className="in" inputMode="numeric" value={s.reps} placeholder={previous[i]?.reps ?? ""} aria-label={`Repeticiones, serie ${i + 1}`} onChange={(e) => setValue(i, "reps", e.target.value)} />
              {effortOn && (
                <input className="in" inputMode="decimal" value={s.rpe} placeholder={effort === "RPE" ? "8" : "2"} aria-label={`${effort}, serie ${i + 1}`} onChange={(e) => setValue(i, "rpe", e.target.value)} />
              )}
              <button type="button" className="chk" onClick={() => toggleDone(i)} aria-pressed={s.done} aria-label={`Serie ${i + 1} hecha`}>
                <Icon name="check" />
              </button>
            </div>
          ))}
          <p className="muted ex-auto">Se marca sola al escribir peso y repeticiones. También puedes tocar ✓ para repetir lo de la última vez.</p>
          <div className="row">
            <button
              type="button"
              className="btn ghost sm"
              onClick={() =>
                edit((ex) => {
                  ex.sets.push({ kg: "", reps: "", rpe: "", done: false });
                })
              }
            >
              <Icon name="plus" /> Serie
            </button>
            {exercise.sets.length > 1 && (
              <button
                type="button"
                className="btn quiet sm"
                onClick={() =>
                  edit((ex) => {
                    if (ex.sets.length > 1) ex.sets.pop();
                  })
                }
              >
                Quitar última
              </button>
            )}
            <button type="button" className="btn quiet sm ex-rm" onClick={remove}>
              Quitar ejercicio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

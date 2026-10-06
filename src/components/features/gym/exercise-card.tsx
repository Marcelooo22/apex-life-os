"use client";

import { Icon } from "@/components/ui/icon";
import { useSheet } from "@/components/ui/sheet-provider";
import { lastSets } from "@/lib/gym";
import { startRest } from "@/lib/rest-timer";
import { updateState } from "@/lib/store";
import type { ActiveExercise, GymState } from "@/lib/types";
import { cn, haptic } from "@/lib/utils";

type SetField = "kg" | "reps" | "rpe";

/** Un ejercicio del entreno en curso con sus series editables. */
export function ExerciseCard({ exercise, gym }: { exercise: ActiveExercise; gym: GymState }) {
  const { confirm } = useSheet();
  const effort = gym.effort || "RPE";
  const previous = lastSets(gym, exercise.name);
  const previousText = previous.length
    ? "Última vez: " + previous.map((s) => `${s.kg}×${s.reps}`).join("  ")
    : "Primera vez con este ejercicio";

  const edit = (recipe: (ex: ActiveExercise) => void) =>
    updateState((d) => {
      const ex = d.gym.active?.exercises.find((e) => e.id === exercise.id);
      if (ex) recipe(ex);
    });

  const setValue = (index: number, field: SetField, value: string) =>
    edit((ex) => {
      const set = ex.sets[index];
      if (set) set[field] = value;
    });

  const toggleDone = (index: number) => {
    const willBeDone = !exercise.sets[index]?.done;
    const prev = previous[index];
    edit((ex) => {
      const set = ex.sets[index];
      if (!set) return;
      set.done = willBeDone;
      if (willBeDone) {
        if (set.kg === "" && prev) set.kg = prev.kg;
        if (set.reps === "" && prev) set.reps = prev.reps;
      }
    });
    if (willBeDone) {
      haptic(12);
      startRest(gym.rest);
    }
  };

  const remove = () =>
    confirm("¿Quitar ejercicio?", "Se descartan sus series de este entreno.", "Quitar", () => {
      updateState((d) => {
        if (d.gym.active) d.gym.active.exercises = d.gym.active.exercises.filter((e) => e.id !== exercise.id);
      });
    });

  return (
    <div className="ex">
      <div className="ex-h">
        <strong>{exercise.name}</strong>
        <button type="button" className="icon-btn h-10 w-10 text-base" onClick={remove} aria-label={`Quitar ${exercise.name}`}>
          <Icon name="x" />
        </button>
      </div>
      <div className="prev muted">{previousText}</div>
      <div className="set-h">
        <span>Serie</span>
        <span>kg</span>
        <span>Reps</span>
        <span>{effort}</span>
        <span />
      </div>
      {exercise.sets.map((s, i) => (
        <div className={cn("set", s.done && "done")} key={i}>
          <span className="n">{i + 1}</span>
          <input
            className="in"
            inputMode="decimal"
            value={s.kg}
            placeholder={previous[i]?.kg ?? ""}
            aria-label={`Peso en kg, serie ${i + 1}`}
            onChange={(e) => setValue(i, "kg", e.target.value)}
          />
          <input
            className="in"
            inputMode="numeric"
            value={s.reps}
            placeholder={previous[i]?.reps ?? ""}
            aria-label={`Repeticiones, serie ${i + 1}`}
            onChange={(e) => setValue(i, "reps", e.target.value)}
          />
          <input
            className="in"
            inputMode="decimal"
            value={s.rpe}
            placeholder={effort === "RPE" ? "8" : "2"}
            aria-label={`${effort}, serie ${i + 1}`}
            onChange={(e) => setValue(i, "rpe", e.target.value)}
          />
          <button type="button" className="chk" onClick={() => toggleDone(i)} aria-pressed={s.done} aria-label={`Serie ${i + 1} hecha`}>
            <Icon name="check" />
          </button>
        </div>
      ))}
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
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useSheet } from "@/components/ui/sheet-provider";
import { formatDuration } from "@/lib/dates";
import { openWorkout } from "@/lib/focus";
import type { ActiveWorkout, GymState } from "@/lib/types";
import { discardWorkout, finishWorkout } from "./workout-actions";

/** Cronómetro del entreno (se actualiza solo este componente, no toda la pantalla). */
export function Elapsed({ start }: { start: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  return <div className="elapsed">{formatDuration(now - start)}</div>;
}

/** Resumen del entreno en curso dentro de la página del gym; el entreno en sí vive en su propia pantalla. */
export function ActiveWorkoutCard({ workout }: { workout: ActiveWorkout; gym: GymState }) {
  const { confirm } = useSheet();
  const done = workout.exercises.filter((e) => e.sets.length && e.sets.every((s) => s.done)).length;
  const sets = workout.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  return (
    <section className="card wk-sum">
      <div className="a-head">
        <div>
          <span className="muted">Entreno en curso</span>
          <h3>{workout.split}</h3>
        </div>
        <Elapsed start={workout.start} />
      </div>
      <p className="muted">
        {done} de {workout.exercises.length} ejercicios · {sets} series hechas
      </p>
      <button type="button" className="btn primary big gap" onClick={openWorkout}>
        <Icon name="dumbbell" /> Volver al entreno
      </button>
      <div className="row gap">
        <button type="button" className="btn ghost" onClick={finishWorkout}>
          Terminar
        </button>
        <button type="button" className="btn quiet" onClick={() => confirm("¿Descartar entreno?", "Se pierden las series registradas en esta sesión.", "Descartar", discardWorkout)}>
          Descartar
        </button>
      </div>
    </section>
  );
}

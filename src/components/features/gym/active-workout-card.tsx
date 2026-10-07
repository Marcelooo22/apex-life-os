"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useSheet } from "@/components/ui/sheet-provider";
import { formatDuration } from "@/lib/dates";
import { buildSession } from "@/lib/gym";
import { fmtRest, hideRest } from "@/lib/rest-timer";
import { updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { ActiveWorkout, GymState } from "@/lib/types";
import { ExerciseCard } from "./exercise-card";
import { useGymSheets } from "./use-gym-sheets";

/** Cronómetro del entreno (se actualiza solo este componente, no toda la pantalla). */
function Elapsed({ start }: { start: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  return <div className="elapsed">{formatDuration(now - start)}</div>;
}

export function ActiveWorkoutCard({ workout, gym }: { workout: ActiveWorkout; gym: GymState }) {
  const sheets = useGymSheets();
  const { confirm } = useSheet();
  const firstPending = workout.exercises.find((e) => !e.sets.every((s) => s.done))?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(firstPending);
  const done = workout.exercises.filter((e) => e.sets.length && e.sets.every((s) => s.done)).length;

  const advance = (fromId: string) => {
    const list = workout.exercises;
    const i = list.findIndex((e) => e.id === fromId);
    const next = [...list.slice(i + 1), ...list.slice(0, i)].find((e) => !e.sets.every((s) => s.done));
    setOpenId(next?.id ?? null);
    if (!next) toast("Completaste todos los ejercicios. Cuando quieras, pulsa Terminar");
  };

  const finish = () => {
    const session = buildSession(gym);
    if (!session) {
      toast("Completa al menos una serie para guardar el entreno");
      return;
    }
    updateState((d) => {
      d.gym.sessions.push(session);
      delete d.gym.marks[session.date];
      d.gym.active = null;
    });
    hideRest();
    toast(session.prs.length ? `Entreno guardado. Nuevo récord en ${session.prs.join(", ")}` : "Entreno guardado");
  };

  const discard = () =>
    confirm("¿Descartar entreno?", "Se pierden las series registradas en esta sesión.", "Descartar", () => {
      updateState((d) => {
        d.gym.active = null;
      });
      hideRest();
    });

  return (
    <section className="card">
      <div className="a-head">
        <div>
          <span className="muted">Entreno en curso</span>
          <h3>{workout.split}</h3>
        </div>
        <Elapsed start={workout.start} />
      </div>
      <div className="a-sub">
        <span className="muted">
          {done} de {workout.exercises.length} ejercicios
        </span>
        <button type="button" className="chip" onClick={sheets.rest}>
          Descanso {fmtRest(gym.rest)}
        </button>
      </div>
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
      <div className="row gap">
        <button type="button" className="btn primary" onClick={finish}>
          Terminar
        </button>
        <button type="button" className="btn quiet" onClick={discard}>
          Descartar
        </button>
      </div>
    </section>
  );
}

"use client";

import { dayLabel } from "@/lib/dates";
import { sessionVolume } from "@/lib/gym";
import type { Session } from "@/lib/types";
import { fmt } from "@/lib/utils";
import { useGymSheets } from "./use-gym-sheets";

export function GymHistory({ sessions }: { sessions: Session[] }) {
  const sheets = useGymSheets();
  const recent = [...sessions].reverse().slice(0, 8);

  return (
    <section className="card">
      <div className="card-h">
        <h3>Historial</h3>
      </div>
      {recent.length ? (
        recent.map((s) => (
          <button key={s.id} type="button" className="hist" onClick={() => sheets.session(s.id)}>
            <span>
              <strong>{s.split}</strong>
              {s.prs?.length ? <span className="tag">PR</span> : null}
              <small>
                {dayLabel(s.date)}, {s.exercises.length} ejercicios
              </small>
            </span>
            <span className="text-right">
              <strong>{fmt(sessionVolume(s))} kg</strong>
              <small>{s.mins || 0} min</small>
            </span>
          </button>
        ))
      ) : (
        <div className="empty">Aún no hay entrenos registrados. El primero queda guardado aquí.</div>
      )}
    </section>
  );
}

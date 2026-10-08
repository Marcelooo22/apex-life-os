"use client";

import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { PROGRAMS } from "@/lib/presets";
import type { GymState } from "@/lib/types";
import { startWorkout } from "./start";
import { useGymSheets } from "./use-gym-sheets";

interface Props {
  gym: GymState;
  split: string;
  onSplit: (split: string) => void;
}

export function StartWorkoutCard({ gym, split, onSplit }: Props) {
  const sheets = useGymSheets();
  const names = Object.keys(gym.routines);
  const current = gym.routines[split] ? split : (names[0] ?? "");
  const list = gym.routines[current] ?? [];
  const first = gym.sessions.length === 0;

  return (
    <section className="card">
      <div className="card-h">
        <h3>Empezar entreno</h3>
        <button type="button" className="btn quiet sm" onClick={sheets.programs}>
          {gym.program ? "Cambiar programa" : "Elegir programa"}
        </button>
      </div>
      {gym.program && (
        <p className="muted prog-now">
          Programa: <b>{gym.program === "custom" ? "Armado por ti" : (PROGRAMS.find((p) => p.id === gym.program)?.name ?? "Personalizado")}</b>
        </p>
      )}
      {first && (
        <button type="button" className="g-tip" onClick={sheets.programs}>
          <b>¿Primera vez?</b> Elige un programa ya armado (cuerpo completo, torso/pierna, PPL…) y empieza hoy.
        </button>
      )}
      <Segmented
        label="Rutina"
        options={names.map((n) => ({ value: n, label: n }))}
        value={current}
        onChange={onSplit}
        trailing={
          <button type="button" className="seg-b" aria-label="Nueva rutina" onClick={() => sheets.addSplit(onSplit)}>
            <Icon name="plus" />
          </button>
        }
      />
      <ul className="routine-list">
        {list.length ? list.map((n) => <li key={n}>{n}</li>) : <li className="muted">Esta rutina no tiene ejercicios. Añádelos con el botón de abajo.</li>}
      </ul>
      <button type="button" className="btn primary big start-inline" onClick={() => startWorkout(gym, current)}>
        Empezar {current}
      </button>
      <button type="button" className="btn quiet big gap" onClick={() => sheets.editRoutine(current)}>
        {list.length ? `Cambiar ejercicios de ${current}` : "Elegir ejercicios"}
      </button>
    </section>
  );
}

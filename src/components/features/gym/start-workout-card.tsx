"use client";

import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { unlockAudio } from "@/lib/audio";
import { createWorkout } from "@/lib/gym";
import { updateState } from "@/lib/store";
import type { GymState } from "@/lib/types";
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

  const start = () => {
    const workout = createWorkout(gym, current);
    updateState((d) => {
      d.gym.active = workout;
    });
    unlockAudio();
  };

  return (
    <section className="card">
      <div className="card-h">
        <h3>Empezar entreno</h3>
      </div>
      <Segmented
        label="División muscular"
        options={names.map((n) => ({ value: n, label: n }))}
        value={current}
        onChange={onSplit}
        trailing={
          <button type="button" className="seg-b" aria-label="Nueva división" onClick={() => sheets.addSplit(onSplit)}>
            <Icon name="plus" />
          </button>
        }
      />
      <p className="muted my-3.5">
        {list.length ? list.join(", ") : "Esta división no tiene ejercicios. Puedes añadirlos durante el entreno o editarla."}
      </p>
      <button type="button" className="btn primary big" onClick={start}>
        Empezar {current}
      </button>
      <button type="button" className="btn quiet big gap" onClick={() => sheets.editRoutine(current)}>
        Editar ejercicios de {current}
      </button>
    </section>
  );
}

import { unlockAudio } from "@/lib/audio";
import { createWorkout } from "@/lib/gym";
import { updateState } from "@/lib/store";
import type { GymState } from "@/lib/types";

/** Empieza un entreno con los ejercicios de la división elegida. */
export function startWorkout(gym: GymState, split: string) {
  const workout = createWorkout(gym, split);
  updateState((d) => {
    d.gym.active = workout;
  });
  unlockAudio();
}

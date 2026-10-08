import { closeWorkout } from "@/lib/focus";
import { buildSession } from "@/lib/gym";
import { hideRest } from "@/lib/rest-timer";
import { getState, updateState } from "@/lib/store";
import { toast } from "@/lib/toast";

/** Guarda el entreno en curso como sesión. Devuelve true si se guardó. */
export function finishWorkout(): boolean {
  const session = buildSession(getState().gym);
  if (!session) {
    toast("Completa al menos una serie para guardar el entreno");
    return false;
  }
  updateState((d) => {
    d.gym.sessions.push(session);
    delete d.gym.marks[session.date];
    d.gym.active = null;
  });
  hideRest();
  closeWorkout();
  toast(session.prs.length ? `Entreno guardado. Nuevo récord en ${session.prs.join(", ")}` : "Entreno guardado");
  return true;
}

export function discardWorkout() {
  updateState((d) => {
    d.gym.active = null;
  });
  hideRest();
  closeWorkout();
}

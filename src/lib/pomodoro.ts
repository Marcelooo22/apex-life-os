import { beep, unlockAudio } from "./audio";
import { dkey } from "./dates";
import { updateState } from "./store";
import { toast } from "./toast";
import { haptic } from "./utils";

export type PomodoroPhase = "focus" | "break" | "long";

export interface PomodoroSnapshot {
  phase: PomodoroPhase;
  /** Milisegundos que quedan. */
  left: number;
  total: number;
  running: boolean;
  /** Enfoques completados en el ciclo actual (0–4). */
  round: number;
}

const MINUTES: Record<PomodoroPhase, number> = { focus: 25, break: 5, long: 15 };
const ROUNDS_BEFORE_LONG = 4;

let phase: PomodoroPhase = "focus";
let total = MINUTES.focus * 60_000;
let remaining = total;
let end: number | null = null;
let round = 0;
let interval: ReturnType<typeof setInterval> | undefined;

const listeners = new Set<() => void>();
const build = (): PomodoroSnapshot => ({
  phase,
  total,
  left: end === null ? remaining : Math.max(0, end - Date.now()),
  running: end !== null,
  round,
});
let snapshot = build();
const emit = () => {
  snapshot = build();
  listeners.forEach((l) => l());
};

function enter(next: PomodoroPhase) {
  phase = next;
  total = MINUTES[next] * 60_000;
  remaining = total;
  end = null;
  clearInterval(interval);
}

function finish() {
  const finished = phase;
  beep();
  haptic([200, 100, 200, 100, 400]);
  if (finished === "focus") {
    round += 1;
    const minutes = MINUTES.focus;
    updateState((d) => {
      const key = dkey();
      d.uni.focus[key] = (d.uni.focus[key] ?? 0) + minutes;
    });
    const long = round >= ROUNDS_BEFORE_LONG;
    if (long) round = 0;
    toast(long ? "Ciclo completo. Toca un descanso largo" : "Enfoque completado. Toca descansar");
    enter(long ? "long" : "break");
  } else {
    toast("Descanso terminado. A enfocarse");
    enter("focus");
  }
  emit();
}

const tick = () => {
  if (end !== null && end - Date.now() <= 0) finish();
  else emit();
};

export function startPomodoro() {
  if (end !== null) return;
  unlockAudio();
  end = Date.now() + remaining;
  clearInterval(interval);
  interval = setInterval(tick, 250);
  emit();
}

export function pausePomodoro() {
  if (end === null) return;
  remaining = Math.max(0, end - Date.now());
  end = null;
  clearInterval(interval);
  emit();
}

export const togglePomodoro = () => (end === null ? startPomodoro() : pausePomodoro());

/** Reinicia la fase actual. */
export function resetPomodoro() {
  enter(phase);
  emit();
}

/** Salta a la siguiente fase sin contar el enfoque. */
export function skipPomodoro() {
  enter(phase === "focus" ? "break" : "focus");
  emit();
}

export const subscribePomodoro = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getPomodoroSnapshot = () => snapshot;
export const PHASE_MINUTES = MINUTES;

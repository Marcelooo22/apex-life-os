import { beep, unlockAudio } from "./audio";
import { haptic } from "./utils";

/** Lo que ve la interfaz del temporizador de descanso. */
export interface RestSnapshot {
  /** Milisegundos que quedan (0 si ya terminó). */
  left: number;
  total: number;
  done: boolean;
}

interface RestInternal {
  end: number;
  total: number;
  fired: boolean;
}

let rest: RestInternal | null = null;
let snapshot: RestSnapshot | null = null;
let interval: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function compute() {
  if (!rest) {
    snapshot = null;
    return;
  }
  const left = rest.end - Date.now();
  if (left <= 0 && !rest.fired) {
    rest.fired = true;
    beep();
    haptic([200, 100, 200, 100, 400]);
    const current = rest;
    setTimeout(() => {
      if (rest === current && rest.fired) hideRest();
    }, 5000);
  }
  snapshot = { left: Math.max(0, left), total: rest.total, done: left <= 0 };
}

const tick = () => {
  compute();
  emit();
};

export function startRest(seconds: number) {
  const sec = seconds || 90;
  rest = { end: Date.now() + sec * 1000, total: sec * 1000, fired: false };
  unlockAudio();
  clearInterval(interval);
  interval = setInterval(tick, 250);
  tick();
}

/** Suma 30 segundos (o reabre 30 s si ya había terminado). */
export function addRest() {
  if (!rest) return;
  const now = Date.now();
  if (rest.end <= now) {
    rest.end = now + 30_000;
    rest.total = 30_000;
  } else {
    rest.end += 30_000;
    rest.total += 30_000;
  }
  rest.fired = false;
  tick();
}

export function hideRest() {
  rest = null;
  snapshot = null;
  clearInterval(interval);
  emit();
}

export const subscribeRest = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getRestSnapshot = () => snapshot;
export const getRestServerSnapshot = () => null;

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

/** Suma (o resta) segundos al descanso en curso. */
export function addRest(delta = 15) {
  if (!rest) return;
  const now = Date.now();
  if (rest.end <= now) {
    if (delta <= 0) return;
    rest.end = now + delta * 1000;
    rest.total = delta * 1000;
  } else {
    rest.end = Math.max(now + 1000, rest.end + delta * 1000);
    rest.total = Math.max(1000, rest.total + delta * 1000);
  }
  rest.fired = false;
  tick();
}

/** Tiempos que se ofrecen con un toque. */
export const REST_PRESETS = [30, 60, 90, 120, 180] as const;

export const fmtRest = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

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

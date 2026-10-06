"use client";

import { useSyncExternalStore } from "react";
import { dkey } from "@/lib/dates";
import { pad } from "@/lib/utils";

/**
 * "Reloj" de baja frecuencia: cambia al pasar la hora o el día, o al volver a la app.
 * Sirve para refrescar saludos, "hoy", rachas, etc. sin recargar.
 */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

const emit = () => listeners.forEach((l) => l());
const onVisible = () => {
  if (!document.hidden) emit();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = setInterval(emit, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", emit);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", emit);
    }
  };
}

const snapshot = () => {
  const now = new Date();
  return `${dkey(now)}T${pad(now.getHours())}`;
};

/** Devuelve la fecha de hoy ("AAAA-MM-DD") y la hora actual (0–23). */
export function useToday() {
  const stamp = useSyncExternalStore(subscribe, snapshot, () => "");
  return { today: stamp.slice(0, 10), hour: Number(stamp.slice(11)) };
}

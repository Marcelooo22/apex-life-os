"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (listener: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
};

/** true si el sistema pide menos animaciones. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

/** Lectura puntual (para usar dentro de eventos, no al renderizar). */
export const prefersReducedMotion = () => window.matchMedia(QUERY).matches;

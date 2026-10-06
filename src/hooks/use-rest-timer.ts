"use client";

import { useSyncExternalStore } from "react";
import { getRestServerSnapshot, getRestSnapshot, subscribeRest, type RestSnapshot } from "@/lib/rest-timer";

/** Estado del temporizador de descanso (null si no hay ninguno activo). */
export function useRestTimer(): RestSnapshot | null {
  return useSyncExternalStore(subscribeRest, getRestSnapshot, getRestServerSnapshot);
}

"use client";

import { useSyncExternalStore } from "react";
import { getPomodoroSnapshot, subscribePomodoro, type PomodoroSnapshot } from "@/lib/pomodoro";

const server: PomodoroSnapshot = { phase: "focus", left: 25 * 60_000, total: 25 * 60_000, running: false, round: 0 };

/** Estado del temporizador de enfoque (sigue corriendo aunque cambies de sección). */
export function usePomodoro(): PomodoroSnapshot {
  return useSyncExternalStore(subscribePomodoro, getPomodoroSnapshot, () => server);
}

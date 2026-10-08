"use client";

import { useSyncExternalStore } from "react";
import { getFocus, subscribeFocus } from "@/lib/focus";

/** ¿Está abierta la pantalla de entrenamiento enfocada? */
export const useWorkoutFocus = () => useSyncExternalStore(subscribeFocus, getFocus, () => false);

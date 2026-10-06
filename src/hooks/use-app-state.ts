"use client";

import { useSyncExternalStore } from "react";
import { getServerState, getState, subscribe } from "@/lib/store";
import type { AppState } from "@/lib/types";

/** Estado global de Apex. Se actualiza solo cuando cambia algún dato. */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

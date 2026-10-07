"use client";

import { useAppState } from "@/hooks/use-app-state";
import { updateState } from "@/lib/store";
import type { CustomModule } from "@/lib/types";

/** El módulo con ese id (o undefined si se borró). */
export function useCustomModule(id: string): CustomModule | undefined {
  return useAppState().custom.find((m) => m.id === id);
}

/** Modifica un módulo concreto con una "receta" de Immer. */
export const editModule = (id: string, recipe: (m: CustomModule) => void) =>
  updateState((d) => {
    const m = d.custom.find((x) => x.id === id);
    if (m) recipe(m);
  });

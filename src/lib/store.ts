import { produce, type Draft } from "immer";
import { STORAGE_KEY } from "./constants";
import { defaults, hydrate } from "./defaults";
import { toast } from "./toast";
import type { AppState } from "./types";

/**
 * Store global muy pequeño (compatible con useSyncExternalStore).
 * - Fuente única de verdad del estado de Apex.
 * - Persiste en localStorage con la misma clave que la versión anterior
 *   ("apex.v2"), así que los datos ya guardados siguen funcionando.
 */
let state: AppState | null = null;
let serverState: AppState | null = null;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function read(): AppState {
  try {
    return hydrate(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return defaults();
  }
}

const emit = () => listeners.forEach((l) => l());

/** Guarda ya en localStorage. */
export function flush() {
  clearTimeout(saveTimer);
  if (!state) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast("No se pudo guardar. Revisa el espacio o el modo privado.");
  }
}

const scheduleSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 120);
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Estado actual (en el navegador, leído de localStorage la primera vez). */
export const getState = (): AppState => (state ??= read());

/** Estado que se usa al renderizar en el servidor. La UI real solo se pinta en el cliente. */
export const getServerState = (): AppState => (serverState ??= defaults());

/** Modifica el estado con una "receta" (estilo Immer) y lo guarda. */
export function updateState(recipe: (draft: Draft<AppState>) => void) {
  state = produce(getState(), recipe);
  emit();
  scheduleSave();
}

/** Sustituye todo el estado (importar copia, borrar todo). */
export function replaceState(next: AppState) {
  state = next;
  emit();
  flush();
}

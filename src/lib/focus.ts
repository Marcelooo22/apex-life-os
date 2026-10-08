/**
 * Pantalla de entrenamiento enfocada. Al abrirla se añade una entrada al historial, así el botón "atrás"
 * del celular la minimiza en vez de sacarte de la app.
 */
let focus = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const subscribeFocus = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const getFocus = () => focus;

export function openWorkout() {
  if (focus) return;
  focus = true;
  try {
    history.pushState({ apexWorkout: 1 }, "");
  } catch {
    /* sin historial */
  }
  emit();
}

export function closeWorkout() {
  if (!focus) return;
  focus = false;
  emit();
  try {
    if ((history.state as { apexWorkout?: number } | null)?.apexWorkout) history.back();
  } catch {
    /* sin historial */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    if (focus && !(history.state as { apexWorkout?: number } | null)?.apexWorkout) {
      focus = false;
      emit();
    }
  });
}

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

/** Muestra un aviso breve en pantalla. Se puede llamar desde cualquier sitio. */
export function toast(message: string) {
  listeners.forEach((l) => l(message));
}

export function onToast(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

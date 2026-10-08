/** Pequeñas celebraciones visuales (p. ej. al añadir una comida). */
export interface Burst {
  id: number;
  emoji: string;
  text: string;
}

import { playNutri } from "./audio";

let counter = 0;
const listeners = new Set<(b: Burst) => void>();

export const subscribeFx = (l: (b: Burst) => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function burst(emoji: string, text: string) {
  playNutri(emoji === "💧" ? "water" : "food");
  const b = { id: ++counter, emoji, text };
  listeners.forEach((l) => l(b));
}

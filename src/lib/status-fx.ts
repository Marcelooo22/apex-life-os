import { confetti } from "./confetti";
import { toast } from "./toast";
import type { SongStatus } from "./types";

/** Celebra al pasar una canción de sección: confeti desde los lados al dominarla, notas al empezar a practicarla. */
export function songStatusFx(prev: SongStatus | undefined, next: SongStatus) {
  if (prev === next) return;
  if (next === "Dominada") {
    confetti();
    toast("¡Dominada! Lo lograste");
  } else if (next === "En práctica" && prev !== "Dominada") {
    confetti("notes");
    toast("A practicar: ya está en tu lista de estudio");
  }
}

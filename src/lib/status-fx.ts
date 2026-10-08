import { playStatus } from "./audio";
import { confetti } from "./confetti";
import { toast } from "./toast";
import type { SongStatus } from "./types";

/** Celebra al pasar una canción de sección: sonido propio de cada estado, y confeti o notas al avanzar. */
export function songStatusFx(prev: SongStatus | undefined, next: SongStatus) {
  if (prev === next) return;
  if (next === "Dominada") {
    playStatus("mastered");
    confetti();
    toast("¡Dominada! Lo lograste");
  } else if (next === "En práctica") {
    playStatus("practice");
    if (prev !== "Dominada") {
      confetti("notes");
      toast("A practicar: ya está en tu lista de estudio");
    }
  } else playStatus("learn");
}

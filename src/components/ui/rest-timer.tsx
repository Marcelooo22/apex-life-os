"use client";

import { useAppState } from "@/hooks/use-app-state";
import { useRestTimer } from "@/hooks/use-rest-timer";
import { addRest, hideRest, startRest } from "@/lib/rest-timer";
import { cn, pad } from "@/lib/utils";
import { Icon } from "./icon";

/** Temporizador de descanso flotante (aparece al marcar una serie como hecha). */
export function RestTimer() {
  const rest = useRestTimer();
  const { gym } = useAppState();
  if (!rest) return null;

  const seconds = Math.ceil(rest.left / 1000);
  const time = rest.done ? "0:00" : `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
  const scale = rest.done ? 0 : Math.max(0, rest.left / rest.total);

  return (
    <div className={cn("rest", rest.done && "done")} role="timer" aria-label="Temporizador de descanso">
      <div className="rest-main">
        <span className="rest-t">{time}</span>
        <span className="rest-l">{rest.done ? "Siguiente serie" : "Descanso"}</span>
      </div>
      <div className="rest-b">
        <button type="button" onClick={addRest}>
          +30 s
        </button>
        <button type="button" onClick={() => startRest(gym.rest)}>
          Reiniciar
        </button>
        <button type="button" onClick={hideRest} aria-label="Cerrar temporizador">
          <Icon name="x" />
        </button>
      </div>
      <div className="rest-prog">
        <i style={{ transform: `scaleX(${scale})` }} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { useRestTimer } from "@/hooks/use-rest-timer";
import { addRest, fmtRest, hideRest, REST_PRESETS, startRest } from "@/lib/rest-timer";
import { updateState } from "@/lib/store";
import { cn, pad } from "@/lib/utils";
import { Icon } from "./icon";

/**
 * Descanso flotante. Arranca solo al completar una serie, se encoge a una esquina a los pocos segundos
 * para no estorbar, y con un toque eliges cuánto descansar (se recuerda para la próxima).
 */
export function RestTimer() {
  const rest = useRestTimer();
  const { gym } = useAppState();
  const [compact, setCompact] = useState(false);
  const startedFor = useRef<number | null>(null);

  const total = rest?.total ?? null;
  // Cada descanso nuevo aparece completo y se encoge solo a los 5 segundos.
  useEffect(() => {
    if (total === null) return;
    if (startedFor.current === total) return;
    startedFor.current = total;
    const open = setTimeout(() => setCompact(false), 0);
    const shrink = setTimeout(() => setCompact(true), 5000);
    return () => {
      clearTimeout(open);
      clearTimeout(shrink);
    };
  }, [total]);
  useEffect(() => {
    if (!rest) startedFor.current = null;
  }, [rest]);

  if (!rest) return null;
  const seconds = Math.ceil(rest.left / 1000);
  const time = rest.done ? "0:00" : `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
  const scale = rest.done ? 0 : Math.max(0, rest.left / rest.total);

  const choose = (sec: number) => {
    updateState((d) => {
      d.gym.rest = sec;
    });
    startRest(sec);
  };

  if (compact && !rest.done) {
    return (
      <button type="button" className="rest compact" onClick={() => setCompact(false)} role="timer" aria-label={`Descanso: ${time}. Toca para ver opciones`}>
        <span className="rest-t">{time}</span>
        <span className="rest-prog">
          <i style={{ transform: `scaleX(${scale})` }} />
        </span>
      </button>
    );
  }

  return (
    <div className={cn("rest", rest.done && "done")} role="timer" aria-label="Temporizador de descanso">
      <div className="rest-top">
        <div className="rest-main">
          <span className="rest-t">{time}</span>
          <span className="rest-l">{rest.done ? "Listo para la siguiente serie" : "Descansando"}</span>
        </div>
        <div className="rest-b">
          <button type="button" onClick={() => addRest(-15)} aria-label="Restar 15 segundos">
            −15
          </button>
          <button type="button" onClick={() => addRest(15)} aria-label="Sumar 15 segundos">
            +15
          </button>
          <button type="button" onClick={hideRest} aria-label="Cerrar temporizador">
            <Icon name="x" />
          </button>
        </div>
      </div>
      <div className="rest-presets" role="group" aria-label="Tiempo de descanso">
        {REST_PRESETS.map((sec) => (
          <button key={sec} type="button" className={cn("chip", gym.rest === sec && "on")} onClick={() => choose(sec)} aria-pressed={gym.rest === sec}>
            {fmtRest(sec)}
          </button>
        ))}
      </div>
      <div className="rest-prog">
        <i style={{ transform: `scaleX(${scale})` }} />
      </div>
    </div>
  );
}

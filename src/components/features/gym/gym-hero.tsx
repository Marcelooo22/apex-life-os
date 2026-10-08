"use client";

import { useEffect, useState } from "react";
import { useToday } from "@/hooks/use-time-key";
import { WEEKDAYS } from "@/lib/constants";
import { addDays, dkey, weekStart } from "@/lib/dates";
import { gymDays } from "@/lib/gym";
import { confetti } from "@/lib/confetti";
import { inactivity, IDLE_PENALTY, levelIndex, LEVELS, rankInfo, rankLabel, rankPoints } from "@/lib/rank";
import { toast } from "@/lib/toast";
import type { GymState } from "@/lib/types";
import { cn, fmt } from "@/lib/utils";
import { RankBadge } from "./rank-badge";
import { RankTimeline } from "./rank-timeline";

/** Cabecera con malla de color: tu rango, cuánto falta para subir y la semana de un vistazo. */
export function GymHero({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const now = new Date(today + "T00:00:00");
  const days = gymDays(gym);
  const start = weekStart(now);
  const points = rankPoints(gym, now);
  const rank = rankInfo(points);
  const idle = inactivity(gym, now);
  const [timeline, setTimeline] = useState(false);
  const level = levelIndex(points);

  // Avisa (una vez) cuando cambias de rango: celebra si subes, y explica si bajas por inactividad.
  useEffect(() => {
    if (!gym.sessions.length && !Object.keys(gym.marks).length) return;
    try {
      const prev = Number(localStorage.getItem("apex.rankLevel"));
      localStorage.setItem("apex.rankLevel", String(level));
      if (!Number.isFinite(prev) || localStorage.getItem("apex.rankSeen") === null) {
        localStorage.setItem("apex.rankSeen", "1");
        return;
      }
      if (level > prev) {
        confetti();
        toast(`¡Subiste a ${LEVELS[level]!.label}!`);
      } else if (level < prev) toast(`Bajaste a ${LEVELS[level]!.label}: una semana sin entrenar resta ${IDLE_PENALTY} puntos`);
    } catch {
      /* sin almacenamiento */
    }
  }, [level, gym.sessions.length, gym.marks]);

  return (
    <header className="g-hero" style={{ "--rk": rank.tier.color, "--rk-rgb": rank.tier.glow } as React.CSSProperties}>
      <div className="g-mesh" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="g-hero-in">
        <div className="g-rank">
          <RankBadge rank={rank} />
          <div className="g-rank-t">
            <span className="g-kicker">
              Tu rango{" "}
              <button type="button" className="info-tip" aria-label="Ver todos los rangos" onClick={() => setTimeline(true)}>
                i
              </button>
            </span>
            <h1>{rankLabel(rank)}</h1>
            <div className="g-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rank.progress * 100)} aria-label="Progreso hacia el siguiente rango">
              <i style={{ width: `${Math.max(3, rank.progress * 100)}%` }} />
            </div>
            <p>{rank.next ? `${fmt(rank.toNext)} puntos para ${rank.next.name}${rank.next.division ? " " + rank.next.division : ""}` : `${fmt(rank.points)} puntos. Estás en lo más alto`}</p>
            {idle.daysLeft !== null && idle.idleDays > 0 && idle.daysLeft <= 3 && <p className="g-warn">Entrena en {idle.daysLeft} {idle.daysLeft === 1 ? "día" : "días"} o perderás {IDLE_PENALTY} puntos</p>}
          </div>
        </div>
        <div className="g-week" role="img" aria-label="Días entrenados esta semana">
          {WEEKDAYS.map((d, i) => {
            const key = dkey(addDays(start, i));
            return (
              <span key={d.long} className={cn(days.has(key) && "on", key === today && "t")}>
                {d.short}
              </span>
            );
          })}
        </div>
      </div>
      {timeline && <RankTimeline gym={gym} onClose={() => setTimeline(false)} />}
    </header>
  );
}

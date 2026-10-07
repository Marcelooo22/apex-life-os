"use client";

import { InfoTip } from "@/components/ui/info-tip";
import { useToday } from "@/hooks/use-time-key";
import { WEEKDAYS } from "@/lib/constants";
import { addDays, dkey, weekStart } from "@/lib/dates";
import { gymDays } from "@/lib/gym";
import { rankInfo, rankLabel, rankPoints } from "@/lib/rank";
import type { GymState } from "@/lib/types";
import { cn, fmt } from "@/lib/utils";
import { RankBadge } from "./rank-badge";

/** Cabecera con malla de color: tu rango, cuánto falta para subir y la semana de un vistazo. */
export function GymHero({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const now = new Date(today + "T00:00:00");
  const days = gymDays(gym);
  const start = weekStart(now);
  const rank = rankInfo(rankPoints(gym, now));
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
              Tu rango <InfoTip term="rangos" />
            </span>
            <h1>{rankLabel(rank)}</h1>
            <div className="g-xp" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rank.progress * 100)} aria-label="Progreso hacia el siguiente rango">
              <i style={{ width: `${Math.max(3, rank.progress * 100)}%` }} />
            </div>
            <p>{rank.next ? `${fmt(rank.toNext)} puntos para ${rank.next.name}${rank.next.division < 3 && rank.next.division > 0 ? " " + ["", "I", "II"][rank.next.division] : ""}` : `${fmt(rank.points)} puntos. Estás en lo más alto`}</p>
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
    </header>
  );
}

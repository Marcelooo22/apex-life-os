"use client";

import { useToday } from "@/hooks/use-time-key";
import { WEEKDAYS } from "@/lib/constants";
import { addDays, dkey, weekStart } from "@/lib/dates";
import { gymDays } from "@/lib/gym";
import type { GymState } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Cabecera con malla de color ámbar (sin fotos): título y la semana de un vistazo. */
export function GymHero({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const days = gymDays(gym);
  const start = weekStart(new Date(today + "T00:00:00"));
  return (
    <header className="g-hero">
      <div className="g-mesh" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="g-hero-in">
        <h1>Iron</h1>
        <p>Sobrecarga progresiva. Cada serie cuenta.</p>
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

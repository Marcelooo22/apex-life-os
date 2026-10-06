"use client";

import { Icon } from "@/components/ui/icon";
import { useToday } from "@/hooks/use-time-key";
import { gymDays, weekCount } from "@/lib/gym";
import { updateState } from "@/lib/store";
import type { GymState } from "@/lib/types";
import { cn, haptic, pad } from "@/lib/utils";
import { useGymSheets } from "./use-gym-sheets";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

interface Props {
  gym: GymState;
  /** 0 = mes actual, -1 = mes anterior… */
  month: number;
  onMonth: (month: number) => void;
}

/** Calendario mensual: toca un día para marcarlo o abrir su entreno. */
export function GymCalendar({ gym, month, onMonth }: Props) {
  const sheets = useGymSheets();
  const { today } = useToday();

  const base = new Date();
  const first = new Date(base.getFullYear(), base.getMonth() + month, 1);
  const year = first.getFullYear();
  const monthIndex = first.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const marked = gymDays(gym);
  const monthName = first.toLocaleDateString("es", { month: "long" });

  const toggleDay = (key: string) => {
    const session = gym.sessions.find((s) => s.date === key);
    if (session) return sheets.session(session.id);
    updateState((d) => {
      if (d.gym.marks[key]) delete d.gym.marks[key];
      else d.gym.marks[key] = true;
    });
    haptic(8);
  };

  let monthCount = 0;
  const cells = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const key = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
    const on = marked.has(key);
    if (on) monthCount++;
    return (
      <button
        key={key}
        type="button"
        className={cn("dot", on && "on", key === today && "today")}
        disabled={key > today}
        aria-pressed={on}
        aria-label={`${day} de ${monthName}: ${on ? "entrenaste" : "sin registro"}`}
        onClick={() => toggleDay(key)}
      >
        {day}
      </button>
    );
  });

  return (
    <section className="card">
      <div className="stats mb-4">
        <div className="stat">
          <b>
            {weekCount(gym)}
            <small className="text-sm text-[var(--muted)]">/{gym.goal}</small>
          </b>
          <span>Esta semana</span>
        </div>
        <div className="stat">
          <b>{monthCount}</b>
          <span>Este mes</span>
        </div>
        <div className="stat">
          <b>{marked.size}</b>
          <span>En total</span>
        </div>
      </div>
      <div className="cal-nav">
        <button type="button" onClick={() => onMonth(month - 1)} aria-label="Mes anterior">
          <Icon name="left" />
        </button>
        <strong>{first.toLocaleDateString("es", { month: "long", year: "numeric" })}</strong>
        <button type="button" onClick={() => onMonth(Math.min(0, month + 1))} disabled={month >= 0} aria-label="Mes siguiente">
          <Icon name="right" />
        </button>
      </div>
      <div className="cal-h" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cal">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {cells}
      </div>
      <p className="muted mt-3 text-[12.5px]">Toca un día para marcarlo o quitarlo. Los entrenos registrados se abren con su detalle.</p>
    </section>
  );
}

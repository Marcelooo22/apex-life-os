"use client";

import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { useRingProgress } from "@/hooks/use-ring-progress";
import { WEEKDAYS, categoryOf } from "@/lib/constants";
import { addDays, dkey, weekStart } from "@/lib/dates";
import { daysLabel, flameTier, formatTime, habitDays, isScheduled, streak, weekProgress } from "@/lib/habits";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  habit: Habit;
  today: string;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

/** Tarjeta de hábito: el anillo muestra la semana y el centro marca hoy. */
export function HabitCard({ habit, today, onToggle, onEdit }: Props) {
  const now = new Date(today + "T00:00:00");
  const done = !!habit.log[today];
  const days = streak(habit, now);
  const tier = flameTier(days);
  const week = weekProgress(habit, now);
  const ring = useRingProgress(week.p);
  const cat = categoryOf(habit.category);
  const start = weekStart(now);
  const scheduled = habitDays(habit);
  const dueToday = isScheduled(habit, now);
  const auto = habit.link === "gym" || habit.link === "water";
  const style = { "--cat": cat?.rgb ?? "52,245,164" } as CSSProperties;

  return (
    <article className={cn("hc", done && "done", !dueToday && !done && "off")} style={style}>
      <div className="hc-ring">
        <svg viewBox="0 0 80 80" aria-hidden="true">
          <circle className="t" cx="40" cy="40" r="34" />
          <circle className="p" cx="40" cy="40" r="34" pathLength={100} transform="rotate(-90 40 40)" style={{ strokeDasharray: `${ring * 100} 100`, opacity: week.p > 0 ? 1 : 0 }} />
        </svg>
        <button
          type="button"
          className="hc-check"
          onClick={() => onToggle(habit.id)}
          aria-pressed={done}
          aria-label={`${habit.name}: ${done ? "hecho hoy" : "pendiente hoy"}${auto ? " (automático)" : ""}`}
        >
          <Icon name={auto && !done ? "lock" : "check"} />
        </button>
      </div>

      <button type="button" className="hc-main" onClick={() => onEdit(habit.id)} aria-label={`Editar ${habit.name}`}>
        <strong>{habit.name}</strong>
        <span className="hc-meta">
          {cat && <Icon name={cat.icon} />}
          <span>{cat?.label ?? "Hábito"}</span>
          <span>{daysLabel(habit)}</span>
          {habit.reminder && (
            <span className="hc-rem">
              <Icon name="bell" />
              {formatTime(habit.reminder)}
            </span>
          )}
        </span>
        <span className="hc-week" aria-hidden="true">
          {WEEKDAYS.map((d, i) => {
            const key = dkey(addDays(start, i));
            return (
              <i key={d.long} className={cn(habit.log[key] && "on", scheduled.includes(i) && "s", key === today && "t")}>
                {d.short}
              </i>
            );
          })}
        </span>
      </button>

      <div className="hc-streak" data-tier={tier} title={`Racha de ${days} ${days === 1 ? "día" : "días"}`}>
        <Icon name="flame" />
        <b>{days}</b>
        <small>{week.planned ? `${week.done}/${week.planned} sem.` : "libre"}</small>
      </div>
    </article>
  );
}

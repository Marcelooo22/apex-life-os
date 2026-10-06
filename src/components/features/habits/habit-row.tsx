"use client";

import { Icon } from "@/components/ui/icon";
import { addDays, dkey } from "@/lib/dates";
import { rate, streak } from "@/lib/habits";
import { SLOTS } from "@/lib/constants";
import type { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";

const slotName = (slot: string) => SLOTS.find(([id]) => id === slot)?.[1] ?? "—";

interface Props {
  habit: Habit;
  today: string;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
}

/** Fila de un hábito: check, racha, puntos de la semana y cumplimiento a 30 días. */
export function HabitRow({ habit, today, onToggle, onEdit }: Props) {
  const done = !!habit.log[today];
  const days = streak(habit);
  const week = Array.from({ length: 7 }, (_, i) => dkey(addDays(new Date(), i - 6)));

  return (
    <article className={cn("h-row", done && "done")}>
      <button
        type="button"
        className="h-check"
        onClick={() => onToggle(habit.id)}
        aria-pressed={done}
        aria-label={`${habit.name}: ${done ? "hecho" : "pendiente"}`}
      >
        <Icon name="check" />
      </button>
      <button type="button" className="h-main" onClick={() => onEdit(habit.id)} aria-label={`Editar ${habit.name}`}>
        <strong>{habit.name}</strong>
        <div className="h-meta">
          <span className="flame">
            <Icon name="flame" /> {days} {days === 1 ? "día" : "días"}
          </span>
          <span>{slotName(habit.slot)}</span>
        </div>
        <div className="week" aria-hidden="true">
          {week.map((k, i) => (
            <i key={k} className={cn(habit.log[k] && "on", i === 6 && "t")} />
          ))}
        </div>
      </button>
      <div className="h-pct">
        <b>{Math.round(rate(habit) * 100)}%</b>
        <small>30 días</small>
      </div>
    </article>
  );
}

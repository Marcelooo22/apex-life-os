"use client";

import { TASK_STATUS } from "@/lib/constants";
import { updateState } from "@/lib/store";
import type { Subject, Task } from "@/lib/types";
import { dueInfo, formatClock, formatGrade, taskKind } from "@/lib/uni";
import { timeToMinutes } from "@/lib/habits";
import { cn, haptic } from "@/lib/utils";

interface Props {
  task: Task;
  subject?: Subject;
  onEdit: (id: string) => void;
  /** Versión de tarjeta (tablero). */
  card?: boolean;
}

export const cycleTask = (id: string) => {
  haptic(10);
  updateState((d) => {
    const task = d.uni.tasks.find((t) => t.id === id);
    if (task) task.status = TASK_STATUS[(TASK_STATUS.indexOf(task.status) + 1) % TASK_STATUS.length] ?? "Pendiente";
  });
};

/** Una evaluación: título, tipo, fecha con hora, nota y estado (toca el estado para avanzarlo). */
export function TaskItem({ task, subject, onEdit, card }: Props) {
  const due = dueInfo(task.due);
  const delivered = task.status === "Entregado";
  const kind = taskKind(task);
  const at = timeToMinutes(task.time);
  return (
    <div className={cn(card ? "t-card" : "t-row", delivered && "done")} data-kind={kind}>
      <button type="button" className="t-main" onClick={() => onEdit(task.id)}>
        <strong>{task.title}</strong>
        <span className="t-meta">
          <span className="t-kind" data-k={kind}>
            {kind}
          </span>
          {subject && <span>{subject.name}</span>}
          <span className={cn("due", !delivered && due.tone)}>
            {delivered ? "Entregada" : due.text}
            {at !== null && !delivered ? `, ${formatClock(at)}` : ""}
          </span>
          {task.grade !== "" && task.grade !== undefined && <span className="t-grade">Nota {formatGrade(Number(task.grade))}</span>}
        </span>
      </button>
      <button type="button" className="st" data-s={task.status} onClick={() => cycleTask(task.id)} aria-label={`Estado: ${task.status}. Toca para cambiar`}>
        {task.status}
      </button>
    </div>
  );
}

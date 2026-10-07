"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-time-key";
import { TASK_STATUS } from "@/lib/constants";
import type { Task, TaskStatus } from "@/lib/types";
import { isThisWeek, isUrgent } from "@/lib/uni";
import { cn } from "@/lib/utils";
import { TaskItem } from "./task-item";
import { UniLeft, UniRight } from "./uni-side";
import { useUniSheets } from "./use-uni-sheets";

type When = "all" | "urgent" | "week";
type Layout = "list" | "board";
const WHEN = [
  { value: "all" as When, label: "Todas" },
  { value: "urgent" as When, label: "Urgente" },
  { value: "week" as When, label: "Esta semana" },
];

const byPriority = (a: Task, b: Task) =>
  Number(a.status === "Entregado") - Number(b.status === "Entregado") || (a.due || "9999").localeCompare(b.due || "9999");

/** Sección "Universidad": asignaturas, tablero de evaluaciones y agenda de enfoque. */
export function UniView() {
  const { uni } = useAppState();
  const { today } = useToday();
  const sheets = useUniSheets();
  const [when, setWhen] = useState<When>("all");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [layout, setLayout] = useState<Layout>("list");
  const now = new Date(today + "T00:00:00");

  const timeMatch = (t: Task) => when === "all" || (when === "urgent" ? isUrgent(t, today) : isThisWeek(t, now));
  const pool = uni.tasks.filter(timeMatch);
  const tasks = pool.filter((t) => status === "all" || t.status === status).sort(byPriority);
  const count = (s: "all" | TaskStatus) => pool.filter((t) => s === "all" || t.status === s).length;
  const urgentCount = uni.tasks.filter((t) => isUrgent(t, today)).length;
  const subjectOf = (t: Task) => uni.subjects.find((s) => s.id === t.subject);
  const statusOptions = [{ value: "all" as const, label: `Todos ${count("all")}` }, ...TASK_STATUS.map((s) => ({ value: s as "all" | TaskStatus, label: `${s} ${count(s)}` }))];

  return (
    <ViewShell
      title="Universidad"
      subtitle={urgentCount ? `${urgentCount} ${urgentCount === 1 ? "evaluación urgente" : "evaluaciones urgentes"}` : "Asignaturas, evaluaciones y enfoque."}
      action={{ label: "Ajustes de Universidad", onClick: sheets.settings }}
      fab={{ label: "Evaluación", onClick: () => sheets.task() }}
      columns={{ left: <UniLeft today={today} />, right: <UniRight today={today} />, labels: ["Asignaturas", "Evaluaciones", "Agenda"] }}
    >
      <div className="u-tools">
        <Segmented label="Urgencia" options={WHEN} value={when} onChange={setWhen} tight />
        <Segmented
          label="Presentación"
          options={[
            { value: "list" as Layout, label: <Icon name="list" /> },
            { value: "board" as Layout, label: <Icon name="board" /> },
          ]}
          value={layout}
          onChange={setLayout}
          tight
          className="u-layout"
        />
      </div>

      {layout === "list" ? (
        <>
          <Segmented label="Estado" options={statusOptions} value={status} onChange={setStatus} tight className="mt-2.5" />
          {tasks.length ? (
            <div className="list">
              {tasks.map((t) => (
                <TaskItem key={t.id} task={t} subject={subjectOf(t)} onEdit={(id) => sheets.task(id)} />
              ))}
            </div>
          ) : (
            <div className="empty">
              {uni.tasks.length ? "No hay evaluaciones con este filtro." : "Sin evaluaciones todavía."}
              <br />
              {uni.tasks.length ? "" : "Toca + para añadir la primera."}
            </div>
          )}
        </>
      ) : (
        <div className="board">
          {TASK_STATUS.map((s) => {
            const column = pool.filter((t) => t.status === s).sort(byPriority);
            return (
              <section key={s} className={cn("b-col")} data-s={s} aria-label={s}>
                <h3>
                  {s} <b>{column.length}</b>
                </h3>
                {column.map((t) => (
                  <TaskItem key={t.id} task={t} subject={subjectOf(t)} onEdit={(id) => sheets.task(id)} card />
                ))}
                {!column.length && <p className="muted text-[12.5px] px-1">Vacío</p>}
              </section>
            );
          })}
        </div>
      )}
    </ViewShell>
  );
}


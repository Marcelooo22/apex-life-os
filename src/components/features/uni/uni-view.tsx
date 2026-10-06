"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-time-key";
import { TASK_STATUS } from "@/lib/constants";
import { updateState } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";
import { dueInfo } from "@/lib/uni";
import { cn, haptic, safeUrl } from "@/lib/utils";
import { useUniSheets } from "./use-uni-sheets";

type TaskFilter = "all" | TaskStatus;

/** Sección "Universidad": carpetas de materias/proyectos y entregas. */
export function UniView() {
  const { uni } = useAppState();
  // Hace que "Hoy / Mañana / Venció…" se refresquen al cambiar de día.
  useToday();
  const sheets = useUniSheets();
  const [filter, setFilter] = useState<TaskFilter>("all");

  const pendingIn = (subjectId: string) => uni.tasks.filter((t) => t.subject === subjectId && t.status !== "Entregado").length;
  const countOf = (key: TaskFilter) => uni.tasks.filter((t) => key === "all" || t.status === key).length;

  const options = [{ value: "all" as TaskFilter, label: `Todas ${countOf("all")}` }].concat(
    TASK_STATUS.map((s) => ({ value: s as TaskFilter, label: `${s} ${countOf(s)}` })),
  );

  const tasks = uni.tasks
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => Number(a.status === "Entregado") - Number(b.status === "Entregado") || (a.due || "9999").localeCompare(b.due || "9999"));

  const cycleTask = (id: string) => {
    haptic(10);
    updateState((d) => {
      const task = d.uni.tasks.find((t) => t.id === id);
      if (task) task.status = TASK_STATUS[(TASK_STATUS.indexOf(task.status) + 1) % TASK_STATUS.length] ?? "Pendiente";
    });
  };

  return (
    <ViewShell title="Universidad" subtitle="Materias, proyectos y entregas." fab={{ label: "Entrega", onClick: () => sheets.task() }}>
      <div className="sec-h">
        <h2>Carpetas</h2>
      </div>
      <div className="grid-f">
        {uni.subjects.map((s) => {
          const drive = safeUrl(s.drive);
          const notes = safeUrl(s.notes);
          const pending = pendingIn(s.id);
          return (
            <div className={cn("fold", s.kind === "Proyecto" && "proj")} key={s.id}>
              <button type="button" className="fold-edit" onClick={() => sheets.subject(s.id)} aria-label={`Editar ${s.name}`}>
                <Icon name="more" />
              </button>
              <svg className="folder" viewBox="0 0 64 52" aria-hidden="true">
                <path d="M4 8a5 5 0 015-5h13l6 6h27a5 5 0 015 5v31a5 5 0 01-5 5H9a5 5 0 01-5-5z" fill="url(#fgA)" />
                <rect x="2" y="15" width="60" height="35" rx="6" fill="url(#fgB)" />
              </svg>
              <strong>{s.name}</strong>
              <small>
                {s.kind === "Proyecto" ? "Proyecto" : "Materia"}
                {pending ? `, ${pending} ${pending === 1 ? "pendiente" : "pendientes"}` : ""}
              </small>
              <div className="links">
                {drive && (
                  <a className="lk" href={drive} target="_blank" rel="noopener noreferrer">
                    Drive <Icon name="link" />
                  </a>
                )}
                {notes && (
                  <a className="lk" href={notes} target="_blank" rel="noopener noreferrer">
                    Apuntes <Icon name="link" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
        <button type="button" className="fold new" onClick={() => sheets.subject()}>
          <Icon name="plus" />
          Nueva carpeta
        </button>
      </div>

      <div className="sec-h">
        <h2>Entregas</h2>
      </div>
      <Segmented label="Filtrar por estado" options={options} value={filter} onChange={setFilter} tight />
      {tasks.length ? (
        <div className="list">
          {tasks.map((t) => {
            const due = dueInfo(t.due);
            const subject = uni.subjects.find((s) => s.id === t.subject);
            const delivered = t.status === "Entregado";
            return (
              <div className={cn("t-row", delivered && "done")} key={t.id}>
                <button type="button" className="t-main" onClick={() => sheets.task(t.id)}>
                  <strong>{t.title}</strong>
                  <div className="t-meta">
                    {subject && <span>{subject.name}</span>}
                    <span className={cn("due", !delivered && due.tone)}>{delivered ? "Entregada" : due.text}</span>
                  </div>
                </button>
                <button type="button" className="st" data-s={t.status} onClick={() => cycleTask(t.id)} aria-label={`Estado: ${t.status}. Toca para cambiar`}>
                  {t.status}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          {uni.tasks.length ? (
            "No hay entregas con este estado."
          ) : (
            <>
              Sin entregas todavía.
              <br />
              Toca + para añadir la primera.
            </>
          )}
        </div>
      )}
    </ViewShell>
  );
}

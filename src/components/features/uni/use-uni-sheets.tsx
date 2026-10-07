"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { TASK_KINDS, TASK_STATUS } from "@/lib/constants";
import { pick } from "@/lib/guards";
import { getState, updateState } from "@/lib/store";
import type { Subject, Task } from "@/lib/types";
import { num, safeUrl, uid } from "@/lib/utils";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Hojas modales de la sección Universidad (asignaturas, evaluaciones y ajustes). */
export function useUniSheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(
    () => ({
      subject(id?: string) {
        const subject = id ? getState().uni.subjects.find((s) => s.id === id) : undefined;

        openSheet({
          title: subject ? "Editar asignatura" : "Nueva asignatura",
          submit: subject ? "Guardar" : "Crear asignatura",
          fields: [
            { name: "name", label: "Nombre", type: "text", required: true, value: subject?.name ?? "", placeholder: "Ej. Finanzas Corporativas" },
            { name: "kind", label: "Tipo", type: "seg", options: [["Materia", "Materia"], ["Proyecto", "Proyecto"]], value: subject?.kind ?? "Materia" },
            { name: "drive", label: "Enlace a Google Drive", type: "url", value: subject?.drive ?? "", placeholder: "drive.google.com/..." },
            { name: "notes", label: "Enlace a apuntes o documentación", type: "url", value: subject?.notes ?? "", placeholder: "Opcional" },
          ],
          danger: subject
            ? {
                label: "Eliminar",
                fn: () => {
                  closeSheet();
                  confirm("¿Eliminar asignatura?", `"${subject.name}" se borrará. Sus evaluaciones se conservan sin asignatura.`, "Eliminar", () => {
                    updateState((d) => {
                      d.uni.subjects = d.uni.subjects.filter((x) => x.id !== subject.id);
                      d.uni.tasks.forEach((t) => {
                        if (t.subject === subject.id) t.subject = "";
                      });
                    });
                  });
                },
              }
            : undefined,
          onSubmit: (v) => {
            const record: Subject = {
              id: subject?.id ?? uid(),
              name: (v.name ?? "").trim(),
              kind: pick(["Materia", "Proyecto"], v.kind, "Materia"),
              drive: safeUrl(v.drive),
              notes: safeUrl(v.notes),
            };
            updateState((d) => {
              const index = subject ? d.uni.subjects.findIndex((x) => x.id === subject.id) : -1;
              if (index >= 0) d.uni.subjects[index] = record;
              else d.uni.subjects.push(record);
            });
          },
        });
      },

      task(id?: string, preset?: { due?: string }) {
        const { subjects, tasks, scale } = getState().uni;
        const task = id ? tasks.find((t) => t.id === id) : undefined;

        openSheet({
          title: task ? "Editar evaluación" : "Nueva evaluación",
          text: "Con fecha y hora, queda bloqueada en tu agenda.",
          submit: task ? "Guardar" : "Añadir",
          fields: [
            { name: "title", label: "Título", type: "text", required: true, value: task?.title ?? "", placeholder: "Ej. Caso práctico de estrategia" },
            { name: "kind", label: "Tipo", type: "seg", options: TASK_KINDS.map((k) => [k, k] as const), value: task?.kind ?? "Entrega" },
            {
              name: "subject",
              label: "Asignatura o proyecto",
              type: "select",
              options: [["", "Sin asignar"], ...subjects.map((s) => [s.id, s.name] as const)],
              value: task ? task.subject : (subjects[0]?.id ?? ""),
            },
            { name: "due", label: "Fecha", type: "date", half: true, value: task?.due ?? preset?.due ?? "" },
            { name: "time", label: "Hora", type: "time", half: true, value: task?.time ?? "", clearLabel: "Todo el día" },
            { name: "mins", label: "Duración en la agenda (min)", type: "number", half: true, value: task?.mins ?? "", placeholder: "60" },
            { name: "status", label: "Estado", type: "seg", options: TASK_STATUS.map((s) => [s, s] as const), value: task?.status ?? "Pendiente" },
            { name: "grade", label: `Nota (sobre ${scale})`, type: "number", half: true, value: task?.grade ?? "", placeholder: "Opcional" },
            { name: "weight", label: "Peso en la asignatura (%)", type: "number", half: true, value: task?.weight ?? "", placeholder: "Opcional" },
          ],
          danger: task
            ? {
                label: "Eliminar",
                fn: () => {
                  updateState((d) => {
                    d.uni.tasks = d.uni.tasks.filter((x) => x.id !== task.id);
                  });
                  closeSheet();
                },
              }
            : undefined,
          onSubmit: (v) => {
            const grade = (v.grade ?? "").trim();
            const weight = (v.weight ?? "").trim();
            const record: Task = {
              id: task?.id ?? uid(),
              title: (v.title ?? "").trim(),
              subject: v.subject ?? "",
              due: DATE_RE.test(v.due ?? "") ? (v.due ?? "") : "",
              status: pick(TASK_STATUS, v.status, "Pendiente"),
              kind: pick(TASK_KINDS, v.kind, "Entrega"),
              time: /^\d{2}:\d{2}$/.test(v.time ?? "") ? v.time : "",
              mins: num(v.mins) > 0 ? Math.min(1440, Math.round(num(v.mins))) : undefined,
              grade: grade ? Math.max(0, Math.min(getState().uni.scale, num(grade))) : "",
              weight: weight ? Math.max(0, Math.min(100, num(weight))) : "",
            };
            updateState((d) => {
              const index = task ? d.uni.tasks.findIndex((x) => x.id === task.id) : -1;
              if (index >= 0) d.uni.tasks[index] = record;
              else d.uni.tasks.push(record);
            });
          },
        });
      },

      settings() {
        const { scale, semester } = getState().uni;
        openSheet({
          title: "Ajustes de Universidad",
          text: "El semestre alimenta la barra de progreso; la escala fija la nota máxima.",
          submit: "Guardar",
          focus: false,
          fields: [
            { name: "scale", label: "Nota máxima (10, 5, 100…)", type: "number", value: scale },
            { name: "semName", label: "Nombre del semestre", type: "text", value: semester?.name ?? "", placeholder: "Ej. 1.er semestre 26-27" },
            { name: "start", label: "Inicio", type: "date", half: true, value: semester?.start ?? "" },
            { name: "end", label: "Fin", type: "date", half: true, value: semester?.end ?? "" },
          ],
          onSubmit: (v) => {
            const start = DATE_RE.test(v.start ?? "") ? (v.start ?? "") : "";
            const end = DATE_RE.test(v.end ?? "") ? (v.end ?? "") : "";
            updateState((d) => {
              d.uni.scale = Math.max(1, num(v.scale) || 10);
              d.uni.semester = start && end && end > start ? { name: (v.semName ?? "").trim() || "Semestre", start, end } : null;
            });
          },
        });
      },
    }),
    [openSheet, closeSheet, confirm],
  );
}

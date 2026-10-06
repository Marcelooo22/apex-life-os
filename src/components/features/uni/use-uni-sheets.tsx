"use client";

import { useMemo } from "react";
import { useSheet } from "@/components/ui/sheet-provider";
import { TASK_STATUS } from "@/lib/constants";
import { pick } from "@/lib/guards";
import { getState, updateState } from "@/lib/store";
import type { Subject, Task } from "@/lib/types";
import { safeUrl, uid } from "@/lib/utils";

/** Hojas modales de la sección Universidad (carpetas y entregas). */
export function useUniSheets() {
  const { openSheet, closeSheet, confirm } = useSheet();

  return useMemo(
    () => ({
      subject(id?: string) {
        const subject = id ? getState().uni.subjects.find((s) => s.id === id) : undefined;

        openSheet({
          title: subject ? "Editar carpeta" : "Nueva carpeta",
          submit: subject ? "Guardar" : "Crear carpeta",
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
                  confirm("¿Eliminar carpeta?", `"${subject.name}" se borrará. Sus entregas se conservan sin materia.`, "Eliminar", () => {
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

      task(id?: string) {
        const { subjects, tasks } = getState().uni;
        const task = id ? tasks.find((t) => t.id === id) : undefined;

        openSheet({
          title: task ? "Editar entrega" : "Nueva entrega",
          submit: task ? "Guardar" : "Añadir entrega",
          fields: [
            { name: "title", label: "Título", type: "text", required: true, value: task?.title ?? "", placeholder: "Ej. Caso práctico de estrategia" },
            {
              name: "subject",
              label: "Materia o proyecto",
              type: "select",
              options: [["", "Sin asignar"], ...subjects.map((s) => [s.id, s.name] as const)],
              value: task ? task.subject : (subjects[0]?.id ?? ""),
            },
            { name: "due", label: "Fecha límite", type: "date", value: task?.due ?? "" },
            { name: "status", label: "Estado", type: "seg", options: TASK_STATUS.map((s) => [s, s] as const), value: task?.status ?? "Pendiente" },
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
            const record: Task = {
              id: task?.id ?? uid(),
              title: (v.title ?? "").trim(),
              subject: v.subject ?? "",
              due: v.due ?? "",
              status: pick(TASK_STATUS, v.status, "Pendiente"),
            };
            updateState((d) => {
              const index = task ? d.uni.tasks.findIndex((x) => x.id === task.id) : -1;
              if (index >= 0) d.uni.tasks[index] = record;
              else d.uni.tasks.push(record);
            });
          },
        });
      },
    }),
    [openSheet, closeSheet, confirm],
  );
}

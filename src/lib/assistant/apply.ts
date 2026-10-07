import { buildModule } from "../custom";
import { dkey } from "../dates";
import { updateState } from "../store";
import type { CustomViewId } from "../types";
import { uid } from "../utils";
import type { Proposal } from "./schema";

export interface Created {
  label: string;
  /** Dónde llevar a la persona: una sección base o el módulo recién creado. */
  open: "gym" | "habits" | CustomViewId;
}

/** Convierte una propuesta aceptada en datos reales de la app. */
export function applyProposal(p: Proposal): Created | null {
  if (p.kind === "module") {
    const created = buildModule(p.spec);
    updateState((d) => {
      d.custom.push(created);
    });
    return { label: `Panel «${created.name}» creado`, open: created.id };
  }

  if (p.kind === "habit") {
    const h = p.habit;
    updateState((d) => {
      d.habits.list.push({
        id: uid(),
        name: h.name,
        slot: h.slot,
        created: dkey(),
        log: {},
        category: h.category,
        days: h.days.length === 7 ? undefined : h.days,
        reminder: h.reminder,
        link: "none",
      });
    });
    try {
      if (h.reminder && typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    } catch {
      /* no soportado */
    }
    return { label: `Hábito «${h.name}» creado`, open: "habits" };
  }

  if (p.kind === "routine") {
    let name = p.routine.name;
    updateState((d) => {
      let n = 2;
      const base = name;
      while (d.gym.routines[name]) name = `${base} ${n++}`;
      d.gym.routines[name] = p.routine.exercises;
    });
    return { label: `Rutina «${name}» creada`, open: "gym" };
  }
  return null;
}

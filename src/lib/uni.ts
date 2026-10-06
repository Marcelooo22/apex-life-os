import { dkey, parseKey } from "./dates";

export interface DueInfo {
  text: string;
  /** "warn" = próxima, "over" = vencida. */
  tone: "" | "warn" | "over";
}

/** Texto y tono de una fecha límite ("Mañana", "Venció hace 2 días"…). */
export function dueInfo(key: string): DueInfo {
  if (!key) return { text: "Sin fecha", tone: "" };
  const diff = Math.round((parseKey(key).getTime() - parseKey(dkey()).getTime()) / 864e5);
  const label = parseKey(key).toLocaleDateString("es", { day: "numeric", month: "short" });
  if (diff < 0) return { text: `Venció hace ${-diff} ${diff === -1 ? "día" : "días"}`, tone: "over" };
  if (diff === 0) return { text: "Hoy", tone: "warn" };
  if (diff === 1) return { text: "Mañana", tone: "warn" };
  if (diff <= 3) return { text: `En ${diff} días, ${label}`, tone: "warn" };
  return { text: `En ${diff} días, ${label}`, tone: "" };
}

import { answerLocal } from "./answers";
import type { ChatTurn } from "./schema";
import type { SectionId } from "./sections";

let aiOff = false;

export interface SectionAnswer {
  text: string;
  engine: "claude" | "local";
}

/** Pregunta al asistente de la sección: Claude si el servidor tiene clave; si no, respuestas guardadas. */
export async function askSection(scope: SectionId, history: ChatTurn[], context: string): Promise<SectionAnswer> {
  const last = [...history].reverse().find((t) => t.role === "user")?.text ?? "";
  if (!aiOff) {
    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, messages: history.slice(-8), context }),
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status === 501) aiOff = true;
      else if (res.ok) {
        const data = (await res.json()) as { reply?: string };
        if (data.reply) return { text: data.reply, engine: "claude" };
      }
    } catch {
      /* se usa la respuesta local */
    }
  }
  return { text: await answerLocal(scope, last), engine: "local" };
}

import { interpretLocal, type Pending } from "./local";
import { sanitizeProposal, type ChatTurn, type Proposal } from "./schema";

export interface AssistantAnswer {
  proposal: Proposal;
  /** Quién interpretó la petición. */
  engine: "claude" | "local";
}

/** Se vuelve false si el servidor dice que no hay clave de IA, para no insistir en cada mensaje. */
let aiAvailable = true;

/**
 * Interpreta una petición. Usa Claude (a través de /api/assistant) si el servidor tiene clave;
 * si no, o si algo falla, usa el intérprete local sin que la persona note la diferencia.
 */
export async function askAssistant(history: ChatTurn[], pending?: Pending): Promise<AssistantAnswer> {
  const last = [...history].reverse().find((t) => t.role === "user")?.text ?? "";
  const local = (): AssistantAnswer => ({ proposal: interpretLocal(last, pending), engine: "local" });

  if (!aiAvailable) return local();
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-6) }),
      signal: AbortSignal.timeout(20_000),
    });
    if (res.status === 501) {
      aiAvailable = false;
      return local();
    }
    if (!res.ok) return local();
    const data = (await res.json()) as { proposal?: unknown };
    const proposal = sanitizeProposal(data.proposal);
    return proposal ? { proposal, engine: "claude" } : local();
  } catch {
    return local();
  }
}

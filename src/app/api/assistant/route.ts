import { NextResponse, type NextRequest } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/assistant/prompt";
import { sanitizeProposal, type ChatTurn } from "@/lib/assistant/schema";
import { rateLimited } from "@/lib/server/http";

/**
 * Asistente con Claude (opcional). Solo funciona si en el servidor existe la variable ANTHROPIC_API_KEY;
 * si no existe, responde 501 y la app usa su intérprete local. La clave nunca llega al navegador.
 * Todo lo que devuelve el modelo se trata como dato no confiable: se valida y se limita (sanitizeProposal)
 * y la persona siempre tiene que pulsar «Crear» para que algo se añada a su app.
 */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const BASE = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

function readTurns(body: unknown): ChatTurn[] | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 8) return null;
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    const r = m as { role?: unknown; text?: unknown };
    if ((r.role !== "user" && r.role !== "assistant") || typeof r.text !== "string") return null;
    const text = r.text.replace(/\s+/g, " ").trim().slice(0, 500);
    if (text) turns.push({ role: r.role, text });
  }
  // La conversación debe empezar y terminar con un mensaje de la persona.
  while (turns.length && turns[0]!.role !== "user") turns.shift();
  return turns.length && turns[turns.length - 1]!.role === "user" ? turns : null;
}

/** Saca el primer objeto JSON de un texto (por si el modelo añade algo alrededor). */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "no-key" }, { status: 501 });
  if (rateLimited(request, "assistant", 10)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const raw = await request.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const turns = readTurns(body);
  if (!turns) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  try {
    const res = await fetch(`${BASE}/v1/messages`, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: turns.map((t) => ({ role: t.role, content: t.text })),
      }),
    });
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const data = (await res.json()) as { content?: { type?: string; text?: string }[] };
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    const proposal = sanitizeProposal(extractJson(text));
    if (!proposal) return NextResponse.json({ error: "bad-output" }, { status: 502 });
    return NextResponse.json({ proposal });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}

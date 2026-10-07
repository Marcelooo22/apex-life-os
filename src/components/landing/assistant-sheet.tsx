"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconByName, Icon } from "@/components/ui/icon";
import { useNavigation } from "@/hooks/use-navigation";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { applyProposal, type Created } from "@/lib/assistant/apply";
import { askAssistant } from "@/lib/assistant/client";
import { ASSISTANT_EXAMPLES, type Pending } from "@/lib/assistant/local";
import type { ChatTurn, Proposal } from "@/lib/assistant/schema";
import { HABIT_CATEGORIES, WEEKDAYS } from "@/lib/constants";
import { TEMPLATE_LABEL } from "@/lib/custom";
import { AiAura } from "@/components/ui/ai-aura";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  proposal?: Proposal;
  engine?: "claude" | "local";
  created?: Created;
  dismissed?: boolean;
}

const WELCOME = "Cuéntame qué quieres añadir: un hábito, una rutina de gym o un panel nuevo para lo que necesites.";

function Preview({ p }: { p: Proposal }) {
  if (p.kind === "module") {
    const s = p.spec;
    return (
      <div className="ai-prev" style={{ "--c": s.color } as React.CSSProperties}>
        <span className="ai-prev-i">
          <IconByName name={s.icon} />
        </span>
        <span>
          <strong>{s.name}</strong>
          <small>
            {TEMPLATE_LABEL[s.template]}
            {s.template === "counter" ? ` · meta ${s.goal} ${s.unit}` : ""}
            {s.template === "checklist" && s.items.length ? ` · ${s.items.length} pendientes` : ""}
          </small>
        </span>
      </div>
    );
  }
  if (p.kind === "habit") {
    const h = p.habit;
    const cat = HABIT_CATEGORIES.find((c) => c.id === h.category);
    return (
      <div className="ai-prev" style={{ "--c": `rgb(${cat?.rgb ?? "52,245,164"})` } as React.CSSProperties}>
        <span className="ai-prev-i">
          <Icon name={cat?.icon ?? "habits"} />
        </span>
        <span>
          <strong>{h.name}</strong>
          <small>
            {h.days.length === 7 ? "Todos los días" : h.days.map((d) => WEEKDAYS[d]?.short).join(" ")}
            {h.reminder ? ` · ${h.reminder}` : ""}
          </small>
        </span>
      </div>
    );
  }
  if (p.kind === "routine") {
    return (
      <div className="ai-prev" style={{ "--c": "#ff6a2b" } as React.CSSProperties}>
        <span className="ai-prev-i">
          <Icon name="dumbbell" />
        </span>
        <span>
          <strong>{p.routine.name}</strong>
          <small>{p.routine.exercises.join(", ")}</small>
        </span>
      </div>
    );
  }
  return null;
}

/** Conversación con el asistente: propone y, solo si aceptas, crea. */
export function AssistantSheet({ onClose }: { onClose: () => void }) {
  const { open } = useNavigation();
  const [shown, setShown] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: "assistant", text: WELCOME }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending | undefined>();
  const counter = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const close = () => {
    setShown(false);
    clearTimeout(closing.current);
    closing.current = setTimeout(onClose, prefersReducedMotion() ? 0 : 380);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    const focus = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 420);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focus);
      clearTimeout(closing.current);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, busy]);

  const send = async (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    const userMsg: Message = { id: counter.current++, role: "user", text: t };
    const history: ChatTurn[] = [...messages, userMsg].filter((m) => m.id !== 0).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, userMsg]);
    setText("");
    setBusy(true);
    const { proposal, engine } = await askAssistant(history, pending);
    setPending(proposal.kind === "reply" ? proposal.pending : undefined);
    setMessages((m) => [...m, { id: counter.current++, role: "assistant", text: proposal.reply, proposal: proposal.kind === "reply" ? undefined : proposal, engine }]);
    setBusy(false);
    inputRef.current?.focus({ preventScroll: true });
  };

  const accept = (id: number, proposal: Proposal) => {
    const created = applyProposal(proposal);
    if (created) setMessages((m) => m.map((x) => (x.id === id ? { ...x, created } : x)));
  };

  const goTo = (created: Created) => {
    close();
    setTimeout(() => open(created.open), 200);
  };

  return (
    <div className={cn("sheet ai-sheet", shown && "open")}>
      {shown && <AiAura colors={["#7c6bff", "#22d3ee", "#f472b6"]} />}
      <div className="sheet-back" onClick={close} />
      <div className="sheet-panel ai-panel" role="dialog" aria-modal="true" aria-label="Asistente de Apex" data-theme="none">
        <div className="grab" />
        <div className="ai-head">
          <span className="ai-mini" aria-hidden="true" />
          <h2>Asistente</h2>
          <button type="button" className="icon-btn h-10 w-10 text-base" onClick={close} aria-label="Cerrar">
            <Icon name="x" />
          </button>
        </div>

        <div className="ai-list" ref={listRef} aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className={cn("ai-msg", m.role)}>
              <p>{m.text}</p>
              {m.proposal && !m.dismissed && (
                <>
                  <Preview p={m.proposal} />
                  {m.created ? (
                    <div className="ai-done">
                      <span>{m.created.label}</span>
                      <button type="button" className="btn primary sm" onClick={() => goTo(m.created!)}>
                        Abrir
                      </button>
                    </div>
                  ) : (
                    <div className="ai-act">
                      <button type="button" className="btn primary sm" onClick={() => accept(m.id, m.proposal!)}>
                        Crear
                      </button>
                      <button type="button" className="btn quiet sm" onClick={() => setMessages((x) => x.map((y) => (y.id === m.id ? { ...y, dismissed: true } : y)))}>
                        Descartar
                      </button>
                    </div>
                  )}
                  {m.engine === "claude" && !m.created && <small className="ai-eng">Interpretado con Claude</small>}
                </>
              )}
            </div>
          ))}
          {busy && (
            <div className="ai-msg assistant" aria-label="Pensando">
              <span className="ai-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div className="ai-ex">
            {ASSISTANT_EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="chip" onClick={() => void send(ex)}>
                {ex}
              </button>
            ))}
          </div>
        )}

        <form
          className="ai-in"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe lo que quieres crear" aria-label="Mensaje" maxLength={400} enterKeyHint="send" autoComplete="off" />
          <button type="submit" className="ai-send" disabled={!text.trim() || busy} aria-label="Enviar">
            <Icon name="send" />
          </button>
        </form>
        <p className="ai-note">Nada se crea sin que pulses «Crear». Si la IA está activada, tu texto se envía a Claude para interpretarlo.</p>
      </div>
    </div>
  );
}

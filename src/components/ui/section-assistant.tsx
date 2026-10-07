"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useAppState } from "@/hooks/use-app-state";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { buildContext } from "@/lib/assistant/context";
import type { ChatTurn } from "@/lib/assistant/schema";
import { askSection } from "@/lib/assistant/section-client";
import { SECTIONS, type SectionId } from "@/lib/assistant/sections";
import { cn } from "@/lib/utils";
import { AiAura } from "./ai-aura";
import { Icon } from "./icon";

interface Msg {
  id: number;
  role: "user" | "assistant";
  text: string;
}

/** Asistente propio de cada sección: esfera abajo a la izquierda y chat con su nombre, color y conocimientos. */
export function SectionAssistant({ scope }: { scope: SectionId }) {
  const cfg = SECTIONS[scope];
  const state = useAppState();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: "assistant", text: cfg.greeting }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const counter = useRef(1);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const close = () => {
    setShown(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), prefersReducedMotion() ? 0 : 360);
  };

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    const focus = setTimeout(() => input.current?.focus({ preventScroll: true }), 420);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(focus);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [msgs, busy]);

  const send = async (raw: string) => {
    const t = raw.trim();
    if (!t || busy) return;
    const user: Msg = { id: counter.current++, role: "user", text: t };
    const history: ChatTurn[] = [...msgs, user].filter((m) => m.id !== 0).map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, user]);
    setText("");
    setBusy(true);
    const answer = await askSection(scope, history, buildContext(scope, state));
    setMsgs((m) => [...m, { id: counter.current++, role: "assistant", text: answer.text }]);
    setBusy(false);
    input.current?.focus({ preventScroll: true });
  };

  const vars = { "--c1": cfg.colors[0], "--c2": cfg.colors[1], "--c3": cfg.colors[2] } as CSSProperties;

  return (
    <>
      <button type="button" className="sa-orb" style={vars} onClick={() => setOpen(true)} aria-label={`Abrir ${cfg.name}`} title={cfg.name}>
        <i className="ai-blob b1" />
        <i className="ai-blob b2" />
        <i className="ai-blob b3" />
        <i className="ai-gloss" />
      </button>
      {open && (
        <div className={cn("sheet ai-sheet sa-sheet", shown && "open")} style={vars}>
          {shown && <AiAura colors={cfg.colors} />}
          <div className="sheet-back" onClick={close} />
          <div className="sheet-panel ai-panel" role="dialog" aria-modal="true" aria-label={cfg.name}>
            <div className="grab" />
            <div className="ai-head">
              <span className="ai-mini" aria-hidden="true" />
              <h2>{cfg.name}</h2>
              <button type="button" className="icon-btn h-10 w-10 text-base" onClick={close} aria-label="Cerrar">
                <Icon name="x" />
              </button>
            </div>
            <div className="ai-list" ref={list} aria-live="polite">
              {msgs.map((m) => (
                <div key={m.id} className={cn("ai-msg", m.role)}>
                  {m.text.split("\n").map((line, i) => (line.trim() ? <p key={i}>{line}</p> : null))}
                </div>
              ))}
              {busy && (
                <div className="ai-msg assistant" aria-label="Pensando">
                  <span className="ai-dots"><i /><i /><i /></span>
                </div>
              )}
            </div>
            {msgs.length <= 3 && (
              <div className="ai-ex">
                {cfg.chips.map((c) => (
                  <button key={c} type="button" className="chip" onClick={() => void send(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}
            <form className="ai-in" onSubmit={(e: FormEvent) => { e.preventDefault(); void send(text); }}>
              <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={cfg.placeholder} aria-label="Mensaje" maxLength={400} enterKeyHint="send" autoComplete="off" />
              <button type="submit" className="ai-send" disabled={!text.trim() || busy} aria-label="Enviar">
                <Icon name="send" />
              </button>
            </form>
            <p className="ai-note">Respuestas orientativas. Si la IA está activada, se envía un resumen de esta sección (sin datos de salud como peso o medidas) a Claude.</p>
          </div>
        </div>
      )}
    </>
  );
}

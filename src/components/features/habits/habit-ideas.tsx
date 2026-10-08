"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { HABIT_CATEGORIES, SLOTS } from "@/lib/constants";
import { HABIT_IDEAS, type HabitIdea } from "@/lib/habit-ideas";
import type { HabitCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const slotLabel = (id: string) => SLOTS.find(([s]) => s === id)?.[1] ?? "";
const GAP = 22;
const MIN_SIDE = 300;

/** Rellena el formulario abierto con una idea: nombre, categoría y momento. Los días y la hora los elige la persona. */
function apply(idea: HabitIdea, category: HabitCategory) {
  const name = document.getElementById("f-name") as HTMLInputElement | null;
  if (name) {
    name.value = idea.name;
    name.dispatchEvent(new Event("input", { bubbles: true }));
  }
  document.querySelector<HTMLInputElement>(`input[name="category"][value="${category}"]`)?.click();
  document.querySelector<HTMLInputElement>(`input[name="slot"][value="${idea.slot}"]`)?.click();
}

interface Layout {
  /** Posición de la burbuja (cerrada). */
  bubble: { left: number; top: number };
  /** Panel lateral: posición y tamaño; null = no hay sitio (se usa dentro de la hoja). */
  side: { left: number; top: number; width: number; height: number; push: number } | null;
}

/**
 * «Ideas de hábitos»: una burbuja con linterna a la izquierda del formulario. Al tocarla se despliega un panel igual
 * de grande que el formulario y este se desplaza a la derecha para que quepan los dos y se pueda leer con calma.
 * En pantallas estrechas se despliega dentro de la hoja.
 */
export function HabitIdeas() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<HabitCategory>("health");
  const [picked, setPicked] = useState("");
  const [layout, setLayout] = useState<Layout | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const remeasure = useRef<() => void>(() => {});

  // Mide la hoja (sin desplazar) y calcula dónde van la burbuja y el panel.
  useEffect(() => {
    const sheet = anchor.current?.closest(".sheet") as HTMLElement | null;
    const panel = sheet?.querySelector(".sheet-panel") as HTMLElement | null;
    if (!sheet || !panel) return;
    const measure = () => {
      const shifted = sheet.classList.contains("hi-open");
      const r = panel.getBoundingClientRect();
      const baseLeft = r.left - (shifted ? Number(sheet.style.getPropertyValue("--hi-push").replace("px", "")) / 2 : 0);
      const vw = window.innerWidth;
      const room = baseLeft - 12;
      const side = vw >= 900 ? Math.min(400, vw - r.width - GAP - 40) : 0;
      setLayout({
        bubble: { left: Math.max(10, baseLeft - 164), top: r.top + 18 },
        side: side >= MIN_SIDE && room > 0 ? { width: side, height: r.height, top: r.top, left: (vw - (side + GAP + r.width)) / 2, push: side + GAP } : null,
      });
    };
    measure();
    remeasure.current = measure;
    const settle = window.setTimeout(measure, 700); // cuando la hoja ya terminó de subir
    panel.addEventListener("transitionend", measure);
    window.addEventListener("resize", measure);
    const watch = new MutationObserver(() => {
      if (!sheet.classList.contains("open")) setOpen(false); // se está cerrando la hoja
    });
    watch.observe(sheet, { attributes: true, attributeFilter: ["class"] });
    return () => {
      window.clearTimeout(settle);
      panel.removeEventListener("transitionend", measure);
      window.removeEventListener("resize", measure);
      watch.disconnect();
    };
  }, []);

  // Desplaza el formulario a la derecha mientras el panel está abierto.
  useEffect(() => {
    const sheet = anchor.current?.closest(".sheet") as HTMLElement | null;
    if (!sheet) return;
    sheet.classList.add("hi-ready");
    if (open && layout?.side) {
      sheet.style.setProperty("--hi-push", `${layout.side.push}px`);
      sheet.classList.add("hi-open");
    } else sheet.classList.remove("hi-open");
    return () => {
      sheet.classList.remove("hi-open", "hi-ready");
      sheet.style.removeProperty("--hi-push");
    };
  }, [open, layout]);

  const current = HABIT_CATEGORIES.find((c) => c.id === cat)!;
  const content = (
    <>
      <div className="hi-cats" role="radiogroup" aria-label="Categoría de las ideas">
        {HABIT_CATEGORIES.map((c) => {
          const on = cat === c.id;
          return (
            <button key={c.id} type="button" role="radio" aria-checked={on} className={cn("hi-cat", on && "on")} style={{ "--c": c.rgb } as React.CSSProperties} onClick={() => setCat(c.id)}>
              {on ? <Icon name="check" /> : <Icon name={c.icon} />} {c.label}
            </button>
          );
        })}
      </div>
      <p className="hi-now" style={{ "--c": current.rgb } as React.CSSProperties}>
        <b>{current.label}</b> · {HABIT_IDEAS[cat].length} ideas
      </p>
      <ul className="hi-list">
        {HABIT_IDEAS[cat].map((idea, i) => (
          <li key={`${cat}-${idea.name}`} style={{ animationDelay: `${i * 35}ms` }}>
            <button
              type="button"
              className={cn("hi-item", picked === idea.name && "on")}
              onClick={() => {
                apply(idea, cat);
                setPicked(idea.name);
              }}
            >
              <span>{idea.name}</span>
              <small>{slotLabel(idea.slot)}</small>
            </button>
          </li>
        ))}
      </ul>
      <p className="hi-tip">Toca una idea y solo elige los días y la hora.</p>
    </>
  );

  const inline = !layout?.side;
  return (
    <span className="hi" ref={anchor}>
      {inline && (
        <button type="button" className={cn("hi-bubble", open && "on")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span aria-hidden="true">🔦</span> Ideas de hábitos
        </button>
      )}
      {inline && open && <div className="hi-inline">{content}</div>}
      {!inline && layout && typeof document !== "undefined" &&
        createPortal(
          <>
            <button type="button" className={cn("hi-bubble hi-float-bubble", open && "gone")} style={{ left: layout.bubble.left, top: layout.bubble.top }} aria-expanded={open} aria-hidden={open} tabIndex={open ? -1 : 0} onClick={() => {
                remeasure.current();
                setOpen(true);
              }}
            >
              <span aria-hidden="true">🔦</span> Ideas de hábitos
            </button>
            {open && layout.side && (
              <aside className="hi-side" aria-label="Ideas de hábitos" style={{ left: layout.side.left, top: layout.side.top, width: layout.side.width, height: layout.side.height }}>
                <div className="hi-h">
                  <h2>Ideas de hábitos</h2>
                  <button type="button" className="icon-btn h-9 w-9 text-sm" aria-label="Cerrar ideas" onClick={() => setOpen(false)}>
                    <Icon name="x" />
                  </button>
                </div>
                {content}
              </aside>
            )}
          </>,
          document.body,
        )}
    </span>
  );
}

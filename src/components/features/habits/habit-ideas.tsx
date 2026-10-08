"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { HABIT_CATEGORIES, SLOTS } from "@/lib/constants";
import { HABIT_IDEAS, type HabitIdea } from "@/lib/habit-ideas";
import type { HabitCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const slotLabel = (id: string) => SLOTS.find(([s]) => s === id)?.[1] ?? "";

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

type Place = { left: number; top: number; width: number; maxH: number } | null;

/** Burbuja «Ideas de hábitos»: despliega un panel flotante junto a la hoja (o dentro de ella en pantallas estrechas). */
export function HabitIdeas() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<HabitCategory>("health");
  const [picked, setPicked] = useState("");
  const [place, setPlace] = useState<Place>(null);

  useEffect(() => {
    if (!open) return;
    const calc = () => {
      const panel = document.querySelector(".sheet-panel");
      if (!panel) return setPlace(null);
      const r = panel.getBoundingClientRect();
      const want = 330;
      const gap = 16;
      const room = (side: "l" | "r") => (side === "l" ? r.left : window.innerWidth - r.right) - gap - 12;
      const side = room("l") >= 260 ? "l" : room("r") >= 260 ? "r" : null;
      if (!side) return setPlace(null);
      const width = Math.min(want, room(side));
      setPlace({ left: side === "l" ? r.left - gap - width : r.right + gap, top: Math.max(14, r.top), width, maxH: Math.min(window.innerHeight - 28, 620) });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [open]);

  const list = (
    <>
      <div className="hi-cats" role="tablist" aria-label="Categorías">
        {HABIT_CATEGORIES.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={cn("hi-cat", cat === c.id && "on")} style={{ "--c": c.rgb } as React.CSSProperties} onClick={() => setCat(c.id)}>
            <Icon name={c.icon} /> {c.label}
          </button>
        ))}
      </div>
      <ul className="hi-list">
        {HABIT_IDEAS[cat].map((idea, i) => (
          <li key={idea.name} style={{ animationDelay: `${i * 35}ms` }}>
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

  return (
    <div className="hi">
      <button type="button" className={cn("hi-bubble", open && "on")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">💡</span> Ideas de hábitos
      </button>
      {open && !place && <div className="hi-inline">{list}</div>}
      {open && place && typeof document !== "undefined" && createPortal(
        <aside className="hi-float" aria-label="Ideas de hábitos" style={{ left: place.left, top: place.top, width: place.width, maxHeight: place.maxH }}>
          <div className="hi-h">
            <b>Ideas de hábitos</b>
            <button type="button" className="icon-btn h-9 w-9 text-sm" aria-label="Cerrar ideas" onClick={() => setOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          {list}
        </aside>,
        document.body,
      )}
    </div>
  );
}

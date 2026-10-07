"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Rings } from "@/components/ui/rings";
import { useSheet } from "@/components/ui/sheet-provider";
import { counterStreak, ledgerBalance } from "@/lib/custom";
import { addDays, dkey, dayLabel } from "@/lib/dates";
import { toast } from "@/lib/toast";
import type { CustomModule } from "@/lib/types";
import { cn, fmt, haptic, num, uid } from "@/lib/utils";
import { editModule } from "./use-custom";

interface Props {
  module: CustomModule;
  today: string;
}

/* ===================== Lista de tareas ===================== */
export function ChecklistView({ module: m }: Props) {
  const [text, setText] = useState("");
  const done = m.items.filter((i) => i.done).length;

  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim().slice(0, 120);
    if (!t) return;
    editModule(m.id, (x) => {
      x.items.push({ id: uid(), text: t, done: false });
    });
    setText("");
  };

  return (
    <>
      <section className="card">
        <div className="card-h">
          <h3>
            {done} de {m.items.length} listas
          </h3>
        </div>
        <ProgressBar value={m.items.length ? done / m.items.length : 0} color="var(--ac)" />
        <form className="qa" onSubmit={add}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Añadir un pendiente" aria-label="Nuevo pendiente" maxLength={120} />
          <button type="submit" className="btn primary" aria-label="Añadir">
            <Icon name="plus" />
          </button>
        </form>
      </section>
      <section className="card">
        {m.items.length === 0 && <div className="empty">Tu lista está vacía. Añade el primer pendiente arriba.</div>}
        <ul className="cl">
          {m.items.map((i) => (
            <li key={i.id} className={cn(i.done && "done")}>
              <button
                type="button"
                className="cl-chk"
                aria-pressed={i.done}
                aria-label={i.text}
                onClick={() => {
                  haptic(10);
                  editModule(m.id, (x) => {
                    const it = x.items.find((y) => y.id === i.id);
                    if (it) it.done = !it.done;
                  });
                }}
              >
                <Icon name="check" />
              </button>
              <span>{i.text}</span>
              <button
                type="button"
                className="icon-btn h-9 w-9 text-base"
                aria-label={`Quitar ${i.text}`}
                onClick={() =>
                  editModule(m.id, (x) => {
                    x.items = x.items.filter((y) => y.id !== i.id);
                  })
                }
              >
                <Icon name="x" />
              </button>
            </li>
          ))}
        </ul>
        {done > 0 && (
          <button
            type="button"
            className="btn quiet big gap"
            onClick={() =>
              editModule(m.id, (x) => {
                x.items = x.items.filter((y) => !y.done);
              })
            }
          >
            Quitar las {done} completadas
          </button>
        )}
      </section>
    </>
  );
}

/* ===================== Contador diario ===================== */
export function CounterView({ module: m, today }: Props) {
  const [amount, setAmount] = useState("");
  const value = m.log[today] ?? 0;
  const streak = counterStreak(m, today);
  const days = Array.from({ length: 14 }, (_, i) => dkey(addDays(new Date(today + "T00:00:00"), i - 13)));
  const max = Math.max(m.goal, ...days.map((d) => m.log[d] ?? 0));

  const add = (n: number) => {
    if (!Number.isFinite(n) || n === 0) return;
    haptic(10);
    editModule(m.id, (x) => {
      x.log[today] = Math.max(0, Math.round(((x.log[today] ?? 0) + n) * 100) / 100);
    });
  };

  return (
    <>
      <section className="card">
        <div className="rings">
          <Rings items={[{ r: 80, s: 18, c: m.color, p: value / m.goal }]} label={`${value} de ${m.goal} ${m.unit}`} />
          <div className="rings-c">
            <b>{fmt(value)}</b>
            <span>
              de {fmt(m.goal)} {m.unit}
            </span>
          </div>
        </div>
        <div className="chips ct-quick">
          {m.quick.map((q) => (
            <button key={q} type="button" className="chip on" onClick={() => add(q)}>
              +{fmt(q)}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => add(-(m.quick[0] ?? 1))} aria-label={`Quitar ${m.quick[0] ?? 1}`} disabled={value <= 0}>
            −{fmt(m.quick[0] ?? 1)}
          </button>
        </div>
        <form
          className="qa"
          onSubmit={(e) => {
            e.preventDefault();
            const n = num(amount);
            if (n > 0) add(n);
            else toast("Escribe una cantidad mayor que 0");
            setAmount("");
          }}
        >
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Otra cantidad" aria-label="Otra cantidad" />
          <button type="submit" className="btn ghost">
            Sumar
          </button>
        </form>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Últimos 14 días</h3>
          <span className="flame">
            <Icon name="flame" /> {streak} {streak === 1 ? "día" : "días"}
          </span>
        </div>
        <div className="ct-bars" role="img" aria-label="Cantidad de los últimos 14 días">
          {days.map((d) => {
            const v = m.log[d] ?? 0;
            return (
              <div key={d} className={cn("ct-b", d === today && "t", v >= m.goal && "hit")} title={`${dayLabel(d)}: ${v}`}>
                <i style={{ height: `${Math.max((v / max) * 100, v ? 5 : 0)}%` }} />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/* ===================== Registro de movimientos ===================== */
export function LedgerView({ module: m, today }: Props) {
  const { confirm } = useSheet();
  const [kind, setKind] = useState<"out" | "in">("out");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const month = today.slice(0, 7);
  const monthly = m.entries.filter((e) => e.date.startsWith(month));
  const income = monthly.filter((e) => (e.amount ?? 0) > 0).reduce((s, e) => s + (e.amount ?? 0), 0);
  const spent = monthly.filter((e) => (e.amount ?? 0) < 0).reduce((s, e) => s - (e.amount ?? 0), 0);
  const money = (n: number) => {
    const abs = Math.abs(Math.round(n * 100) / 100);
    const text = abs.toLocaleString("es-CO", { minimumFractionDigits: Number.isInteger(abs) ? 0 : 2, maximumFractionDigits: 2 });
    return `${n < 0 ? "−" : ""}${m.currency}${text}`;
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    const n = Math.abs(num(amount));
    if (!n) return toast("Escribe un importe");
    editModule(m.id, (x) => {
      x.entries.push({ id: uid(), date: today, amount: kind === "in" ? n : -n, text: note.trim().slice(0, 120) });
    });
    setAmount("");
    setNote("");
  };

  return (
    <>
      <section className="card lg-sum">
        <span className="muted">Balance total</span>
        <b className="lg-total">{money(ledgerBalance(m))}</b>
        <div className="stats">
          <div className="stat">
            <b>{money(income)}</b>
            <span>Ingresos del mes</span>
          </div>
          <div className="stat">
            <b>{money(-spent)}</b>
            <span>Gastos del mes</span>
          </div>
          <div className="stat">
            <b>{money(income - spent)}</b>
            <span>Neto del mes</span>
          </div>
        </div>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Nuevo movimiento</h3>
        </div>
        <form onSubmit={add}>
          <div className="seg" role="radiogroup" aria-label="Tipo de movimiento">
            {([["out", "Gasto"], ["in", "Ingreso"]] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={kind === v} className={cn("seg-b", kind === v && "on")} onClick={() => setKind(v)}>
                {l}
              </button>
            ))}
          </div>
          <div className="qa">
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={`Importe (${m.currency})`} aria-label="Importe" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Concepto" aria-label="Concepto" maxLength={120} />
          </div>
          <button type="submit" className="btn primary big gap">
            Añadir {kind === "in" ? "ingreso" : "gasto"}
          </button>
        </form>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Movimientos</h3>
        </div>
        {m.entries.length === 0 && <div className="empty">Aún no hay movimientos.</div>}
        {[...m.entries].reverse().slice(0, 60).map((e) => (
          <button
            key={e.id}
            type="button"
            className="meal"
            onClick={() =>
              confirm("¿Eliminar movimiento?", `${e.text || "Sin concepto"}, ${money(e.amount ?? 0)}`, "Eliminar", () =>
                editModule(m.id, (x) => {
                  x.entries = x.entries.filter((y) => y.id !== e.id);
                }),
              )
            }
          >
            <span>
              <strong>{e.text || "Sin concepto"}</strong>
              <small>
                <span>{dayLabel(e.date)}</span>
              </small>
            </span>
            <b className={cn((e.amount ?? 0) > 0 ? "pos" : "neg")}>{money(e.amount ?? 0)}</b>
          </button>
        ))}
      </section>
    </>
  );
}

/* ===================== Diario ===================== */
const MOODS = ["Mal", "Regular", "Normal", "Bien", "Genial"] as const;

export function JournalView({ module: m, today }: Props) {
  const { confirm } = useSheet();
  const [text, setText] = useState("");
  const [mood, setMood] = useState(3);

  const add = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim().slice(0, 600);
    if (!t) return toast("Escribe algo primero");
    editModule(m.id, (x) => {
      x.entries.push({ id: uid(), date: today, text: t, mood });
    });
    setText("");
  };

  return (
    <>
      <section className="card">
        <form onSubmit={add}>
          <textarea className="notes" value={text} onChange={(e) => setText(e.target.value)} placeholder="¿Qué quieres recordar de hoy?" aria-label="Nueva entrada" maxLength={600} />
          <div className="chips mt-3" role="radiogroup" aria-label="Cómo te sientes">
            {MOODS.map((label, i) => (
              <button key={label} type="button" role="radio" aria-checked={mood === i + 1} className={cn("chip", mood === i + 1 && "on")} onClick={() => setMood(i + 1)}>
                {label}
              </button>
            ))}
          </div>
          <button type="submit" className="btn primary big gap">
            Guardar entrada
          </button>
        </form>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Entradas</h3>
        </div>
        {m.entries.length === 0 && <div className="empty">Aún no has escrito nada.</div>}
        {[...m.entries].reverse().slice(0, 60).map((e) => (
          <button
            key={e.id}
            type="button"
            className="jr"
            onClick={() =>
              confirm("¿Eliminar entrada?", "Se borrará de tu diario.", "Eliminar", () =>
                editModule(m.id, (x) => {
                  x.entries = x.entries.filter((y) => y.id !== e.id);
                }),
              )
            }
          >
            <small>
              {dayLabel(e.date)}
              {e.mood ? ` · ${MOODS[e.mood - 1]}` : ""}
            </small>
            <span>{e.text}</span>
          </button>
        ))}
      </section>
    </>
  );
}

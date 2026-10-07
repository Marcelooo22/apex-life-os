"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useToday } from "@/hooks/use-time-key";
import { buildHeatmap, type HeatCell } from "@/lib/gym";
import { parseKey } from "@/lib/dates";
import type { GymState } from "@/lib/types";
import { fmt } from "@/lib/utils";

interface Tip {
  cell: HeatCell;
  x: number;
  y: number;
}

const ROW_LABELS = ["L", "", "X", "", "V", "", ""];

/** Trayectoria anual: 53 semanas × 7 días, celdas de 10 px con brillo según el volumen del día. */
export function GymHeatmap({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const heat = useMemo(() => buildHeatmap(gym, new Date(today + "T00:00:00")), [gym, today]);
  const cells = useMemo(() => new Map(heat.weeks.flat().flatMap((c) => (c ? [[c.key, c] as const] : []))), [heat]);
  const [tip, setTip] = useState<Tip | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // Abre mostrando lo más reciente (a la derecha).
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const place = (node: EventTarget) => {
    const target = (node as HTMLElement).closest<HTMLElement>("[data-k]");
    const cell = target ? cells.get(target.dataset.k ?? "") : undefined;
    const box = wrap.current?.getBoundingClientRect();
    if (!target || !cell || !box) return setTip(null);
    const r = target.getBoundingClientRect();
    setTip({ cell, x: Math.min(Math.max(r.left - box.left + r.width / 2, 100), box.width - 100), y: r.top - box.top });
  };

  // Con ratón el tooltip sigue al puntero; en pantallas táctiles aparece al tocar una celda.
  const hover = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") place(e.target);
  };

  const { stats } = heat;
  const long = tip ? parseKey(tip.cell.key).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  return (
    <section className="card hm-card">
      <div className="card-h">
        <h3>Últimos 12 meses</h3>
        <span className="muted hm-leg" aria-hidden="true">
          Menos
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} className={`hm-c l${l}`} />
          ))}
          Más
        </span>
      </div>
      <div className="hm-wrap" ref={wrap} onPointerLeave={() => setTip(null)}>
        <div className="hm-scroll" ref={scroller} onScroll={() => setTip(null)}>
          <div
            className="hm"
            role="img"
            aria-label={`${stats.activeDays} días de entreno en los últimos 12 meses y ${stats.weeksOnGoal} semanas con la meta cumplida`}
            onPointerOver={(e) => hover(e)}
            onPointerMove={(e) => hover(e)}
            onClick={(e) => place(e.target)}
          >
            <div className="hm-rows" aria-hidden="true">
              {ROW_LABELS.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
            <div className="hm-grid">
              <div className="hm-months" aria-hidden="true">
                {heat.months.map((m) => (
                  <span key={m.col} style={{ gridColumn: m.col + 1 }}>
                    {m.label}
                  </span>
                ))}
              </div>
              <div className="hm-cols">
                {heat.weeks.map((week, w) => (
                  <div className="hm-col" key={w}>
                    {week.map((c, d) => (c ? <i key={c.key} data-k={c.key} className={`hm-c l${c.level}`} /> : <i key={d} className="hm-c off" />))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {tip && (
          <div className="hm-tip" role="status" style={{ left: tip.x, top: tip.y }}>
            <strong>{long}</strong>
            {tip.cell.level === 0 ? (
              <span>Día de descanso</span>
            ) : tip.cell.marked ? (
              <span>Entreno marcado, sin detalle</span>
            ) : (
              <>
                <span className="hm-m">{tip.cell.muscles}</span>
                <span>
                  {fmt(tip.cell.volume)} kg · {tip.cell.mins} min · {tip.cell.sets} series
                </span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="stats mt-4">
        <div className="stat">
          <b>{stats.activeDays}</b>
          <span>Días entrenados</span>
        </div>
        <div className="stat">
          <b>{stats.volume >= 1000 ? `${(stats.volume / 1000).toLocaleString("es", { maximumFractionDigits: 1 })} t` : `${fmt(stats.volume)} kg`}</b>
          <span>Volumen total</span>
        </div>
        <div className="stat">
          <b>
            {stats.weeksOnGoal}
            <small className="text-sm text-[var(--muted)]">/{stats.weeks}</small>
          </b>
          <span>Semanas en meta</span>
        </div>
      </div>
      <p className="muted mt-3 text-[12.5px]">
        {stats.weekStreak > 0 ? `Racha: ${stats.weekStreak} ${stats.weekStreak === 1 ? "semana" : "semanas"} seguidas cumpliendo tu meta.` : "Cumple tu meta semanal para empezar una racha."} El brillo crece con el volumen del día.
      </p>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { fmt } from "@/lib/utils";
import { IDLE_PENALTY, inactivity, LEVELS, levelIndex, rankInfo, rankLabel, rankPoints } from "@/lib/rank";
import type { GymState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeArt, RankBadge } from "./rank-badge";

const MIN = 62;
const MAX = 150;

/** Todos los rangos como una línea de tiempo: cada escalón es más grande y más brillante que el anterior. */
export function RankTimeline({ gym, onClose }: { gym: GymState; onClose: () => void }) {
  const now = new Date();
  const points = rankPoints(gym, now);
  const rank = rankInfo(points);
  const idle = inactivity(gym, now);
  const cur = levelIndex(points);
  const [closing, setClosing] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 240);
  };

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(".rt-node")];
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("rt-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("rt-in"), io.unobserve(e.target))), { threshold: 0.2 });
    items.forEach((el) => io.observe(el));
    const t = setTimeout(() => items[cur]?.scrollIntoView({ block: "center", behavior: "smooth" }), 700);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [cur]);

  return createPortal(
    <div className={cn("rt-back", closing && "rt-out")} onClick={close}>
      <div className="rt" role="dialog" aria-modal="true" aria-label="Rangos del gym" onClick={(e) => e.stopPropagation()}>
        <button ref={closeBtn} type="button" className="icon-btn rt-x" onClick={close} aria-label="Cerrar">
          <Icon name="x" />
        </button>
        <header className="rt-head">
          <RankBadge rank={rank} size={96} />
          <div>
            <span className="muted">Tu rango</span>
            <h2>{rankLabel(rank)}</h2>
            <p>{fmt(points)} puntos{rank.next ? ` · ${fmt(rank.toNext)} para ${rank.next.name}${rank.next.division ? " " + rank.next.division : ""}` : " · lo más alto"}</p>
          </div>
        </header>

        <div className="rt-rules">
          <span><b>+12</b> por entreno</span>
          <span><b>+30</b> semana en meta</span>
          <span><b>+8</b> por récord</span>
          <span className="neg"><b>−{IDLE_PENALTY}</b> por cada 7 días sin entrenar</span>
        </div>
        {idle.daysLeft !== null && (
          <p className={cn("rt-idle", idle.daysLeft <= 3 && idle.idleDays > 0 && "warn")}>
            {idle.penalty > 0 ? `La inactividad te ha restado ${idle.penalty} puntos. ` : ""}
            {idle.idleDays === 0 ? "Entrenaste hoy: vas perfecto." : `Llevas ${idle.idleDays} ${idle.idleDays === 1 ? "día" : "días"} sin entrenar. `}
            {idle.idleDays > 0 && `En ${idle.daysLeft} ${idle.daysLeft === 1 ? "día" : "días"} perderías ${IDLE_PENALTY} puntos si no entrenas.`}
          </p>
        )}

        <ol className="rt-line" ref={list}>
          {LEVELS.map((lv, i) => {
            const state = i < cur ? "rt-done" : i === cur ? "rt-now" : "rt-locked";
            const power = i / (LEVELS.length - 1);
            const size = MIN + (MAX - MIN) * power;
            return (
              <li key={lv.label} className={cn("rt-node", state, lv.division <= 1 && "rt-first")} style={{ "--rk": lv.tier.color, "--rk-rgb": lv.tier.glow, "--p": power } as React.CSSProperties}>
                <div className="rt-art">
                  <BadgeArt tierIndex={lv.tierIndex} division={lv.division} size={size} power={power} locked={state === "rt-locked"} />
                </div>
                <div className="rt-card">
                  {lv.division <= 1 && <span className="rt-tier">{lv.tier.name}</span>}
                  <b>{lv.label}</b>
                  <small>{fmt(lv.from)} puntos</small>
                  {state === "rt-now" && <em className="rt-here">Estás aquí</em>}
                  {state === "rt-done" && <em className="rt-ok">Conseguido</em>}
                  {state === "rt-locked" && <em className="rt-lock">Te faltan {fmt(Math.max(1, lv.from - points))}</em>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>,
    document.body,
  );
}

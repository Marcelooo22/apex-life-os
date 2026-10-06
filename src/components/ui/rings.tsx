"use client";

import { useRingProgress } from "@/hooks/use-ring-progress";
import { clamp01 } from "@/lib/utils";

export interface RingSpec {
  r: number;
  /** Grosor del trazo. */
  s?: number;
  c: string;
  /** Progreso 0–1. */
  p: number;
}

function Ring({ r, s = 16, c, p }: RingSpec) {
  const progress = clamp01(p);
  const shown = useRingProgress(progress);
  return (
    <>
      <circle className="ring-t" cx="100" cy="100" r={r} style={{ strokeWidth: s }} />
      <circle
        className="ring-p"
        cx="100"
        cy="100"
        r={r}
        pathLength={100}
        transform="rotate(-90 100 100)"
        style={{ stroke: c, strokeWidth: s, strokeDasharray: `${shown * 100} 100`, opacity: progress > 0 ? 1 : 0 }}
      />
    </>
  );
}

/** Anillos concéntricos animados (estilo Apple Fitness). */
export function Rings({ items, label }: { items: RingSpec[]; label: string }) {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={label}>
      {items.map((item) => (
        <Ring key={item.r} {...item} />
      ))}
    </svg>
  );
}

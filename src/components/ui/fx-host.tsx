"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { subscribeFx, type Burst } from "@/lib/fx";

/** Dibuja las celebraciones: el emoji rebota, salen chispas y sube un "+222 kcal". */
export function FxHost() {
  const [items, setItems] = useState<Burst[]>([]);
  useEffect(
    () =>
      subscribeFx((b) => {
        if (prefersReducedMotion()) return;
        setItems((cur) => [...cur, b]);
        setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== b.id)), 1700);
      }),
    [],
  );
  return (
    <div className="fx" aria-hidden="true">
      {items.map((b) => (
        <div key={b.id} className="fx-b">
          <span className="fx-e">{b.emoji}</span>
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} className="fx-p" style={{ "--a": `${i * 45}deg`, "--d": `${60 + (i % 3) * 18}px` } as React.CSSProperties}>
              {i % 2 ? "✦" : b.emoji}
            </i>
          ))}
          <span className="fx-t">{b.text}</span>
        </div>
      ))}
    </div>
  );
}

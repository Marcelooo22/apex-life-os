"use client";

import { useRingProgress } from "@/hooks/use-ring-progress";
import { clamp01 } from "@/lib/utils";

/** Barra de progreso animada. `value` va de 0 a 1. */
export function ProgressBar({ value, color, className }: { value: number; color: string; className?: string }) {
  const shown = useRingProgress(clamp01(value));
  return (
    <div className={`bar-t ${className ?? ""}`}>
      <i style={{ width: `${shown * 100}%`, background: color }} />
    </div>
  );
}

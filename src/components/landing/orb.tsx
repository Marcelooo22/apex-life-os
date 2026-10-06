"use client";

import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { useRingProgress } from "@/hooks/use-ring-progress";
import type { Point } from "@/hooks/use-navigation";
import type { Metric } from "@/lib/metrics";
import type { ViewId } from "@/lib/types";
import { clamp01 } from "@/lib/utils";

export interface OrbConfig {
  id: ViewId;
  label: string;
  icon: IconName;
  /** Color del anillo y `r,g,b` para los resplandores. */
  color: string;
  rgb: string;
}

interface OrbProps extends OrbConfig {
  metric: Metric;
  onOpen: (id: ViewId, origin: Point) => void;
}

/** Burbuja de sección con anillo de progreso. */
export function Orb({ id, label, icon, color, rgb, metric, onOpen }: OrbProps) {
  const progress = useRingProgress(clamp01(metric.p));
  const vars = { "--c": color, "--rgb": rgb } as CSSProperties;

  return (
    <button
      type="button"
      className="orb"
      style={vars}
      aria-label={label}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onOpen(id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
    >
      <svg className="orb-ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle className="t" cx="50" cy="50" r="48.5" />
        <circle className="p" cx="50" cy="50" r="48.5" pathLength={100} style={{ strokeDasharray: `${progress * 100} 100` }} />
      </svg>
      <Icon name={icon} className="ico" />
      <b>{label}</b>
      <small>{metric.t}</small>
    </button>
  );
}

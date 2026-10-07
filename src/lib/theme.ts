import type { CSSProperties } from "react";
import { hexToRgb } from "./custom";
import { getState } from "./store";
import { isCustomViewId, type Theme } from "./types";

/** Variables de color de un módulo personalizado (las secciones base usan reglas CSS fijas). */
export function themeVars(theme: Theme | string): CSSProperties | undefined {
  if (!isCustomViewId(theme)) return undefined;
  const m = getState().custom.find((c) => c.id === theme);
  if (!m) return undefined;
  const rgb = hexToRgb(m.color);
  return {
    "--ac": m.color,
    "--btn": m.color,
    "--ink": "#0a0a0c",
    "--vbg": `color-mix(in srgb, ${m.color} 5%, #000)`,
    "--rgb": rgb,
    "--r": "22px",
  } as CSSProperties;
}

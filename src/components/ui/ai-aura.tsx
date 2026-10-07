import type { CSSProperties } from "react";

/** Brillo ondulante en los bordes de la pantalla (estilo Siri) mientras el asistente está abierto. */
export function AiAura({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <div className="aura" aria-hidden="true" style={{ "--c1": colors[0], "--c2": colors[1], "--c3": colors[2] } as CSSProperties}>
      <i className="aura-glow" />
      <i className="aura-glow b" />
      <i className="aura-ring" />
    </div>
  );
}

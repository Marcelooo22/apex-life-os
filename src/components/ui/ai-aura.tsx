import type { CSSProperties } from "react";

/** Posición (%) de cada mancha de luz alrededor de la pantalla, su tamaño y su ritmo. */
const BLOBS = [
  { x: 0, y: 0, s: 46, d: 14, dl: 0 },
  { x: 100, y: 0, s: 46, d: 16, dl: -5 },
  { x: 0, y: 100, s: 46, d: 15, dl: -9 },
  { x: 100, y: 100, s: 46, d: 13, dl: -3 },
  { x: -2, y: 50, s: 34, d: 17, dl: -7 },
  { x: 102, y: 50, s: 34, d: 12, dl: -11 },
] as const;

/** Brillo en forma de olas alrededor de la pantalla mientras el asistente está abierto. */
export function AiAura({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <div className="aura" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <i
          key={i}
          style={{ "--x": `${b.x}%`, "--y": `${b.y}%`, "--s": `${b.s}vmax`, "--d": `${b.d}s`, "--dl": `${b.dl}s`, "--c": colors[i % 3], "--mx": i % 2 ? "-7vw" : "7vw", "--my": i % 3 ? "5vh" : "-5vh" } as CSSProperties}
        />
      ))}
    </div>
  );
}

import type { CSSProperties } from "react";

/** Posición (%) de cada mancha de luz alrededor de la pantalla, su tamaño y su ritmo. */
const BLOBS = [
  { x: 0, y: 0, s: 62, t: 9, d: 14, dl: 0 },
  { x: 50, y: -3, s: 52, t: 11, d: 12, dl: -3 },
  { x: 100, y: 0, s: 62, t: 10, d: 15, dl: -6 },
  { x: -3, y: 50, s: 50, t: 12, d: 13, dl: -2 },
  { x: 103, y: 50, s: 50, t: 9, d: 16, dl: -5 },
  { x: 0, y: 100, s: 62, t: 10, d: 12, dl: -4 },
  { x: 50, y: 103, s: 54, t: 12, d: 14, dl: -7 },
  { x: 100, y: 100, s: 62, t: 9, d: 15, dl: -1 },
] as const;

/** Brillo en forma de olas alrededor de la pantalla mientras el asistente está abierto. */
export function AiAura({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <div className="aura" aria-hidden="true">
      {BLOBS.map((b, i) => (
        <i
          key={i}
          style={{ "--x": `${b.x}%`, "--y": `${b.y}%`, "--s": `${b.s}vmax`, "--t": `${b.t}s`, "--d": `${b.d}s`, "--dl": `${b.dl}s`, "--c": colors[i % 3], "--mx": i % 2 ? "-7vw" : "7vw", "--my": i % 3 ? "5vh" : "-5vh" } as CSSProperties}
        />
      ))}
    </div>
  );
}

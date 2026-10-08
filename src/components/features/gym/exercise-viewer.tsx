"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { MOTIONS } from "@/lib/anim3d/motions";
import type { ExerciseScene } from "@/lib/anim3d/scene";
import { EXERCISES, ZONE_LABEL } from "@/lib/exercises";

interface Props {
  /** id del ejercicio en el catálogo. */
  exerciseId: string | undefined;
  /** Qué mostrar si ese ejercicio no tiene animación 3D. */
  fallback?: ReactNode;
}

/** Maniquí 3D que repite el movimiento sin parar. Se gira arrastrando. Si no hay WebGL, no muestra nada. */
export function ExerciseViewer({ exerciseId, fallback = null }: Props) {
  const ex = exerciseId ? EXERCISES.find((e) => e.id === exerciseId) : undefined;
  const motion = ex ? MOTIONS[ex.id] : undefined;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ExerciseScene | null>(null);
  const latest = useRef({ ex, motion });
  const paused = useRef(false);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [isPaused, setIsPaused] = useState(() => typeof window !== "undefined" && prefersReducedMotion());

  useEffect(() => {
    latest.current = { ex, motion };
    const s = scene.current;
    if (s && ex && motion) {
      s.setMotion(motion, ex.zones.slice(0, 1), ex.zones.slice(1));
      s.renderAt(0);
    }
  }, [ex, motion, state]);

  const hasMotion = !!motion;
  useEffect(() => {
    if (!hasMotion) return;
    let disposed = false;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let visible = true;
    // Con "reducir movimiento" activado, la animación arranca en pausa.
    paused.current = prefersReducedMotion();

    void import("@/lib/anim3d/scene")
      .then(({ ExerciseScene }) => {
        const el = canvas.current;
        const box = wrap.current;
        if (disposed || !el || !box) return;
        const s = new ExerciseScene(el);
        scene.current = s;
        let clock = 0;
        let last = performance.now();
        let lastDraw = 0;

        const size = () => {
          const r = box.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) s.setSize(r.width, r.height, window.devicePixelRatio || 1);
        };
        size();
        const { ex: e, motion: m } = latest.current;
        if (e && m) s.setMotion(m, e.zones.slice(0, 1), e.zones.slice(1));
        size();
        s.renderAt(0);
        setState("ready");

        ro = new ResizeObserver(() => {
          size();
          s.frame(clock);
        });
        ro.observe(box);
        io = new IntersectionObserver(([entry]) => {
          visible = !!entry?.isIntersecting;
        });
        io.observe(box);

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          const dt = (now - last) / 1000;
          last = now;
          if (!paused.current && visible && !document.hidden) {
            clock += Math.min(dt, 0.1);
            if (now - lastDraw > 24) {
              lastDraw = now;
              s.frame(clock);
            }
          }
        };
        raf = requestAnimationFrame(tick);

        // Girar con el dedo o el ratón (solo en horizontal para no estorbar al desplazamiento).
        let drag: { x: number; az: number } | null = null;
        const down = (ev: PointerEvent) => {
          drag = { x: ev.clientX, az: s.az };
          el.setPointerCapture(ev.pointerId);
        };
        const move = (ev: PointerEvent) => {
          if (!drag) return;
          s.az = drag.az - (ev.clientX - drag.x) * 0.5;
          s.frame(clock);
        };
        const up = () => {
          drag = null;
        };
        el.addEventListener("pointerdown", down);
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      })
      .catch(() => setState("failed"));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [hasMotion]);

  if (!motion || !ex || state === "failed") return <>{fallback}</>;

  const primary = ex.zones.slice(0, 1).map((z) => ZONE_LABEL[z]);
  const secondary = ex.zones.slice(1).map((z) => ZONE_LABEL[z]);

  return (
    <div className="xv">
      <div className="xv-stage" ref={wrap}>
        <canvas ref={canvas} role="img" aria-label={`Animación 3D de ${ex.name}. Arrastra para girar.`} />
        {state === "loading" && <span className="xv-load">Cargando modelo 3D…</span>}
        <button
          type="button"
          className="xv-pp"
          aria-label={isPaused ? "Reanudar animación" : "Pausar animación"}
          onClick={() => {
            paused.current = !paused.current;
            setIsPaused(paused.current);
          }}
        >
          <Icon name={isPaused ? "play" : "pause"} />
        </button>
        <span className="xv-hint">Arrastra para girar</span>
      </div>
      <p className="xv-leg">
        <span><i style={{ background: "#ef5350" }} />{primary.join(", ")}</span>
        {secondary.length > 0 && (
          <span><i style={{ background: "#f5a524" }} />{secondary.join(", ")}</span>
        )}
      </p>
    </div>
  );
}

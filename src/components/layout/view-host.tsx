"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { GymView } from "@/components/features/gym/gym-view";
import { HabitsView } from "@/components/features/habits/habits-view";
import { HobbiesView } from "@/components/features/hobbies/hobbies-view";
import { NutritionView } from "@/components/features/nutrition/nutrition-view";
import { UniView } from "@/components/features/uni/uni-view";
import { CustomView } from "@/components/features/custom/custom-view";
import { useAppState } from "@/hooks/use-app-state";
import { hexToRgb } from "@/lib/custom";
import { themeVars } from "@/lib/theme";
import { isCustomViewId } from "@/lib/types";
import { useNavigation } from "@/hooks/use-navigation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { ViewId } from "@/lib/types";

/** Registro de secciones: para añadir una nueva basta con sumarla aquí y a `ViewId`. */
const VIEWS: Record<string, { label: string; Component: ComponentType }> = {
  gym: { label: "Gym", Component: GymView },
  habits: { label: "Hábitos", Component: HabitsView },
  nutrition: { label: "Nutrición", Component: NutritionView },
  hobbies: { label: "Hobbies e Instrumentos", Component: HobbiesView },
  uni: { label: "Universidad y proyectos", Component: UniView },
};

const OPEN_EASING = "cubic-bezier(.16,1,.3,1)";
const CLOSE_EASING = "cubic-bezier(.5,0,.75,0)";

const farthestCorner = (x: number, y: number) =>
  Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

/** Muestra la sección activa con la animación circular desde la burbuja pulsada. */
export function ViewHost() {
  const { view, instant, originRef } = useNavigation();
  const { custom } = useAppState();
  const reduced = useReducedMotion();
  // La sección sigue montada mientras dura la animación de cierre.
  const [rendered, setRendered] = useState<ViewId | null>(view);
  const ref = useRef<HTMLElement>(null);

  if (view && rendered !== view) setRendered(view);
  if (!view && rendered && (instant || reduced)) setRendered(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!view || !el || instant || reduced) return;
    const { x, y } = originRef.current ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const animation = el.animate(
      [{ clipPath: `circle(30px at ${x}px ${y}px)` }, { clipPath: `circle(${farthestCorner(x, y)}px at ${x}px ${y}px)` }],
      { duration: 650, easing: OPEN_EASING },
    );
    return () => animation.cancel();
  }, [view, instant, reduced, originRef]);

  useEffect(() => {
    const el = ref.current;
    if (view || !rendered || !el || instant || reduced) return;
    const { x, y } = originRef.current ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const animation = el.animate(
      [{ clipPath: `circle(${farthestCorner(x, y)}px at ${x}px ${y}px)` }, { clipPath: `circle(30px at ${x}px ${y}px)` }],
      { duration: 480, easing: CLOSE_EASING, fill: "forwards" },
    );
    animation.onfinish = () => setRendered(null);
    return () => animation.cancel();
  }, [view, rendered, instant, reduced, originRef]);

  if (!rendered) return null;
  const mod = isCustomViewId(rendered) ? custom.find((m) => m.id === rendered) : undefined;
  const builtin = VIEWS[rendered];
  if (!builtin && !mod) return null;
  return (
    <section
      key={rendered}
      ref={ref}
      className="view"
      id={`view-${rendered}`}
      data-theme={rendered}
      aria-label={builtin?.label ?? mod?.name}
      style={mod ? { ...themeVars(rendered), background: `radial-gradient(90% 46% at 50% -8%, rgba(${hexToRgb(mod.color)},.2), transparent 62%), var(--vbg)` } : undefined}
    >
      {builtin ? <builtin.Component /> : <CustomView id={rendered} />}
    </section>
  );
}

"use client";

import { useState } from "react";
import { scaleMacros, type FoodHit } from "@/lib/food";
import type { MacroTotals } from "@/lib/types";
import { fmt } from "@/lib/utils";

interface Props {
  per100: MacroTotals;
  serving: FoodHit["serving"];
  initial: number;
}

/** Selector de gramos con deslizador: recalcula calorías y macros al instante. */
export function PortionField({ per100, serving, initial }: Props) {
  const [grams, setGrams] = useState(initial);
  const m = scaleMacros(per100, grams);
  const set = (value: number) => setGrams(Math.max(1, Math.min(2000, Math.round(value) || 1)));
  const presets = [50, 100, 150, 200, ...(serving && ![50, 100, 150, 200].includes(serving.grams) ? [serving.grams] : [])].sort((a, b) => a - b);

  return (
    <div className="portion">
      <div className="portion-top">
        <input type="hidden" name="grams" value={grams} />
        <label className="portion-num">
          <input type="number" inputMode="numeric" min={1} max={2000} value={grams} onChange={(e) => set(Number(e.target.value))} aria-label="Gramos" />
          <span>g</span>
        </label>
        <div className="portion-kcal">
          <b>{fmt(m.kcal)}</b>
          <span>kcal</span>
        </div>
      </div>
      <input
        type="range"
        className="portion-range"
        min={5}
        max={500}
        step={5}
        value={Math.min(500, Math.max(5, grams))}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Ajustar gramos"
      />
      <div className="chips portion-chips">
        {presets.map((p) => (
          <button key={p} type="button" className={`chip${grams === p ? " on" : ""}`} onClick={() => set(p)}>
            {serving?.grams === p ? `Porción ${p} g` : `${p} g`}
          </button>
        ))}
      </div>
      <dl className="portion-macros">
        <div>
          <dt>Proteína</dt>
          <dd>{m.p} g</dd>
        </div>
        <div>
          <dt>Carbohidratos</dt>
          <dd>{m.c} g</dd>
        </div>
        <div>
          <dt>Grasas</dt>
          <dd>{m.f} g</dd>
        </div>
      </dl>
      <p className="muted text-[12px]">
        Por 100 g: {per100.kcal} kcal · P {per100.p} · C {per100.c} · G {per100.f}
      </p>
    </div>
  );
}

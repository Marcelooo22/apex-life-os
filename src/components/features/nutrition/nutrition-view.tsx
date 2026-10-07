"use client";

import { ViewShell } from "@/components/layout/view-shell";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Rings } from "@/components/ui/rings";
import { useSheet } from "@/components/ui/sheet-provider";
import { useAppState } from "@/hooks/use-app-state";
import { useRingProgress } from "@/hooks/use-ring-progress";
import { useToday } from "@/hooks/use-time-key";
import { MEALS } from "@/lib/constants";
import { longDate } from "@/lib/dates";
import { dayOf, mealTotals } from "@/lib/nutrition";
import { updateState } from "@/lib/store";
import type { MacroTotals, NutritionGoals } from "@/lib/types";
import { fmt, haptic } from "@/lib/utils";
import { FoodSearch } from "./food-search";
import { useNutritionSheets } from "./use-nutrition-sheets";

const COLORS = { p: "#22d3ee", c: "#34d399", f: "#fcd34d" } as const;

function Macro({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  return (
    <div className="mac">
      <div className="mac-h">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {goal} g
        </span>
      </div>
      <ProgressBar value={value / goal} color={color} />
    </div>
  );
}

/** Barra superior: cada tramo es la parte de tu meta de calorías que aporta cada macronutriente. */
function MacroBar({ totals, goals }: { totals: MacroTotals; goals: NutritionGoals }) {
  const parts = [
    { key: "p", label: "Proteína", g: totals.p, kcal: totals.p * 4 },
    { key: "c", label: "Carbohidratos", g: totals.c, kcal: totals.c * 4 },
    { key: "f", label: "Grasas", g: totals.f, kcal: totals.f * 9 },
  ] as const;
  const total = Math.max(goals.kcal, parts.reduce((s, p) => s + p.kcal, 0)) || 1;
  const shown = useRingProgress(1);
  const left = goals.kcal - totals.kcal;
  return (
    <section className="mbar card" aria-label="Macronutrientes de hoy">
      <div className="mbar-track" role="img" aria-label={`Proteína ${Math.round(totals.p)} g, carbohidratos ${Math.round(totals.c)} g, grasas ${Math.round(totals.f)} g`}>
        {parts.map((p) => (
          <i key={p.key} className={`seg-${p.key}`} style={{ width: `${(p.kcal / total) * 100 * shown}%` }} />
        ))}
      </div>
      <div className="mbar-leg">
        {parts.map((p) => (
          <span key={p.key}>
            <i style={{ background: COLORS[p.key] }} />
            {p.label} <b>{Math.round(p.g)} g</b>
          </span>
        ))}
        <span className="mbar-left">{left >= 0 ? `Quedan ${fmt(left)} kcal` : `${fmt(-left)} kcal de más`}</span>
      </div>
    </section>
  );
}

/** Sección "Nutrición": buscador con base de datos, comidas del día y panel de balance. */
export function NutritionView() {
  const state = useAppState();
  const { today } = useToday();
  const { confirm } = useSheet();
  const sheets = useNutritionSheets();

  const goals = state.nutrition.goals;
  const day = dayOf(state, today);
  const totals = mealTotals(state, today);
  const left = goals.kcal - totals.kcal;

  const addWater = (ml: number) => {
    updateState((d) => {
      const entry = (d.nutrition.days[today] ??= { water: 0, meals: [] });
      entry.water = Math.max(0, entry.water + ml);
    });
    haptic(10);
  };

  const resetWater = () =>
    confirm("¿Reiniciar el agua de hoy?", "El contador vuelve a cero.", "Reiniciar", () => {
      updateState((d) => {
        const entry = (d.nutrition.days[today] ??= { water: 0, meals: [] });
        entry.water = 0;
      });
    });

  const leftCol = (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Metas de hoy</h3>
          <button type="button" className="btn quiet sm" onClick={sheets.goals}>
            Editar
          </button>
        </div>
        <dl className="kv">
          <div>
            <dt>Calorías</dt>
            <dd>{fmt(goals.kcal)}</dd>
          </div>
          <div>
            <dt>Proteína</dt>
            <dd>{goals.p} g</dd>
          </div>
          <div>
            <dt>Carbohidratos</dt>
            <dd>{goals.c} g</dd>
          </div>
          <div>
            <dt>Grasas</dt>
            <dd>{goals.f} g</dd>
          </div>
        </dl>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Agua</h3>
          <div className="water-n">
            {(day.water / 1000).toFixed(2)}
            <small>L</small>
          </div>
        </div>
        <ProgressBar value={day.water / goals.water} color="#7dd3fc" className="mb-3.5" />
        <div className="row">
          <button type="button" className="btn primary flex-[2]" onClick={() => addWater(250)}>
            +250 ml
          </button>
          <button type="button" className="btn ghost" onClick={() => addWater(-250)} aria-label="Quitar 250 mililitros">
            −250
          </button>
        </div>
        <button type="button" className="btn quiet big gap" onClick={resetWater}>
          Reiniciar agua de hoy
        </button>
      </section>
    </>
  );

  const rightCol = (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Balance del día</h3>
        </div>
        <div className="rings">
          <Rings label="Calorías de hoy" items={[{ r: 80, s: 18, c: "#34d399", p: totals.kcal / goals.kcal }]} />
          <div className="rings-c">
            <b>{fmt(totals.kcal)}</b>
            <span>{left >= 0 ? `quedan ${fmt(left)} kcal` : `${fmt(-left)} kcal de más`}</span>
          </div>
        </div>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Macronutrientes</h3>
        </div>
        <Macro label="Proteínas" value={totals.p} goal={goals.p} color={COLORS.p} />
        <Macro label="Carbohidratos" value={totals.c} goal={goals.c} color={COLORS.c} />
        <Macro label="Grasas" value={totals.f} goal={goals.f} color={COLORS.f} />
      </section>
    </>
  );

  return (
    <ViewShell
      title="Nutrición"
      subtitle={longDate()}
      action={{ label: "Metas diarias", onClick: sheets.goals }}
      top={<MacroBar totals={totals} goals={goals} />}
      columns={{ left: leftCol, right: rightCol, labels: ["Metas", "Comidas", "Balance"] }}
    >
      <FoodSearch onPick={(f) => sheets.food(f)} onManual={() => sheets.meal()} />
      <section className="card mt-3.5">
        <div className="card-h">
          <h3>Comidas de hoy</h3>
          <span className="muted text-[13px]">{fmt(totals.kcal)} kcal</span>
        </div>
        {day.meals.length === 0 && (
          <div className="empty">
            Aún no has registrado nada hoy.
            <br />
            Busca un alimento arriba para añadirlo.
          </div>
        )}
        {MEALS.map(([type, label]) => {
          const meals = day.meals.filter((m) => m.type === type);
          if (!meals.length) return null;
          return (
            <div className="meal-g" key={type}>
              <div className="meal-gh">
                <span>{label}</span>
                <span>{fmt(meals.reduce((sum, m) => sum + m.kcal, 0))} kcal</span>
              </div>
              {meals.map((m) => (
                <button key={m.id} type="button" className="meal" onClick={() => sheets.meal(m.id)}>
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {m.grams ? <span>{m.grams} g</span> : null}
                      <span>P {Math.round(m.p)}</span>
                      <span>C {Math.round(m.c)}</span>
                      <span>G {Math.round(m.f)}</span>
                    </small>
                  </span>
                  <b>{fmt(m.kcal)} kcal</b>
                </button>
              ))}
            </div>
          );
        })}
      </section>
    </ViewShell>
  );
}

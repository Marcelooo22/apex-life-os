"use client";

import { ViewShell } from "@/components/layout/view-shell";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Rings } from "@/components/ui/rings";
import { useSheet } from "@/components/ui/sheet-provider";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-time-key";
import { MEALS } from "@/lib/constants";
import { longDate } from "@/lib/dates";
import { dayOf, mealTotals } from "@/lib/nutrition";
import { updateState } from "@/lib/store";
import { fmt, haptic } from "@/lib/utils";
import { useNutritionSheets } from "./use-nutrition-sheets";

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

/** Sección "Nutrición": calorías, macros, agua y comidas del día. */
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

  return (
    <ViewShell
      title="Nutrición"
      subtitle={longDate()}
      action={{ label: "Metas diarias", onClick: sheets.goals }}
      fab={{ label: "Comida", onClick: () => sheets.meal() }}
    >
      <section className="card">
        <div className="rings">
          <Rings
            label="Anillos de calorías, proteína y agua"
            items={[
              { r: 88, c: "#fbbf24", p: totals.kcal / goals.kcal },
              { r: 66, c: "#22d3ee", p: totals.p / goals.p },
              { r: 44, c: "#7dd3fc", p: day.water / goals.water },
            ]}
          />
          <div className="rings-c">
            <b>{fmt(totals.kcal)}</b>
            <span>{left >= 0 ? `quedan ${fmt(left)} kcal` : `${fmt(-left)} kcal de más`}</span>
          </div>
        </div>
        <div className="legend">
          <div className="lg">
            <i style={{ background: "#fbbf24" }} />
            <span>Calorías</span>
            <b>
              {fmt(totals.kcal)} / {fmt(goals.kcal)}
            </b>
          </div>
          <div className="lg">
            <i style={{ background: "#22d3ee" }} />
            <span>Proteína</span>
            <b>
              {Math.round(totals.p)} / {goals.p} g
            </b>
          </div>
          <div className="lg">
            <i style={{ background: "#7dd3fc" }} />
            <span>Agua</span>
            <b>
              {(day.water / 1000).toFixed(2)} / {(goals.water / 1000).toFixed(1)} L
            </b>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <h3>Macronutrientes</h3>
        </div>
        <Macro label="Proteínas" value={totals.p} goal={goals.p} color="#22d3ee" />
        <Macro label="Carbohidratos" value={totals.c} goal={goals.c} color="#fbbf24" />
        <Macro label="Grasas" value={totals.f} goal={goals.f} color="#fb923c" />
      </section>

      <section className="card">
        <div className="card-h">
          <div>
            <h3>Agua</h3>
          </div>
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

      <section className="card">
        <div className="card-h">
          <h3>Comidas de hoy</h3>
        </div>
        {day.meals.length === 0 && (
          <div className="empty">
            Aún no has registrado nada hoy.
            <br />
            Toca + para añadir tu primera comida.
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

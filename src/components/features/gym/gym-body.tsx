"use client";

import { useState } from "react";
import { InfoTip } from "@/components/ui/info-tip";
import { LineChart } from "@/components/ui/line-chart";
import { Segmented } from "@/components/ui/segmented";
import { dayLabel } from "@/lib/dates";
import type { BodyEntry, GymState } from "@/lib/types";
import { useBodySheets } from "./use-body-sheets";

type Metric = "weight" | "fat" | "muscle" | "waist";
const META: Record<Metric, { label: string; unit: string; color: string }> = {
  weight: { label: "Peso", unit: " kg", color: "#ff8a2b" },
  fat: { label: "Grasa", unit: "%", color: "#f472b6" },
  muscle: { label: "Músculo", unit: "%", color: "#34d399" },
  waist: { label: "Cintura", unit: " cm", color: "#7dd3fc" },
};
const GOAL_LABEL = { "": "Sin definir", muscle: "Ganar músculo", fat: "Perder grasa", strength: "Fuerza", health: "Salud" } as const;

export const bmiOf = (weight: number, heightCm: number) => weight / (heightCm / 100) ** 2;
const bmiLabel = (b: number) => (b < 18.5 ? "Por debajo del rango" : b < 25 ? "Rango saludable" : b < 30 ? "Por encima del rango" : "Muy por encima del rango");
const delta = (now: number, before: number | undefined, unit: string) =>
  before === undefined ? "" : `${now - before >= 0 ? "+" : "−"}${Math.abs(Math.round((now - before) * 10) / 10).toLocaleString("es")}${unit.trim() === "kg" ? " kg" : unit}`;

/** Pestaña "Mi cuerpo": perfil y evolución de peso, grasa, músculo y cintura. */
export function GymBody({ gym }: { gym: GymState }) {
  const sheets = useBodySheets();
  const [metric, setMetric] = useState<Metric>("weight");
  const entries = [...gym.body].sort((a, b) => a.date.localeCompare(b.date));
  const last = entries.at(-1);
  const prev = entries.at(-2);
  const { sex, height, goal } = gym.profile;
  const available = (["weight", "fat", "muscle", "waist"] as const).filter((m) => entries.some((e) => e[m] !== undefined));
  const active: Metric = available.includes(metric) ? metric : "weight";
  const series = entries.filter((e) => e[active] !== undefined).map((e) => ({ label: dayLabel(e.date), value: e[active] as number }));
  const bmi = last && height ? bmiOf(last.weight, height) : null;
  const first = entries[0];

  if (!last) {
    return (
      <section className="card body-empty">
        <h3>Sigue tu progreso corporal</h3>
        <p className="muted">Registra tu peso (y, si quieres, grasa, músculo y cintura) y verás cómo evolucionas junto a tus entrenos. Tarda diez segundos.</p>
        <button type="button" className="btn primary big" onClick={() => sheets.entry()}>
          Registrar mi peso
        </button>
        <button type="button" className="btn quiet big gap" onClick={sheets.profile}>
          Completar mi perfil
        </button>
      </section>
    );
  }

  const stat = (m: Metric, e: BodyEntry) => (e[m] === undefined ? null : (
    <div className="stat" key={m}>
      <b>
        {(e[m] as number).toLocaleString("es")}
        <small>{META[m].unit}</small>
      </b>
      <span>
        {META[m].label}
        {prev?.[m] !== undefined ? ` · ${delta(e[m] as number, prev[m], META[m].unit)}` : ""}
      </span>
    </div>
  ));

  return (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Tus medidas</h3>
          <button type="button" className="btn primary sm" onClick={() => sheets.entry()}>
            Registrar
          </button>
        </div>
        <div className="stats">{(["weight", "fat", "muscle", "waist"] as const).map((m) => stat(m, last))}</div>
        {bmi !== null && (
          <p className="bmi">
            IMC <b>{bmi.toLocaleString("es", { maximumFractionDigits: 1 })}</b> · {bmiLabel(bmi)} <InfoTip term="imc" />
          </p>
        )}
        {first && first !== last && (
          <p className="muted bmi">
            Desde el {dayLabel(first.date)}: {delta(last.weight, first.weight, " kg")} de peso.
          </p>
        )}
      </section>

      {entries.length >= 2 && (
        <section className="card">
          <div className="card-h">
            <h3>Evolución</h3>
          </div>
          {available.length > 1 && (
            <Segmented label="Medida" options={available.map((m) => ({ value: m, label: META[m].label }))} value={active} onChange={setMetric} tight className="mb-3" />
          )}
          <LineChart points={series.slice(-24)} color={META[active].color} unit={META[active].unit.trim() === "kg" ? "" : META[active].unit} label={`Evolución de ${META[active].label.toLowerCase()}`} />
          <p className="muted mt-2 text-[12.5px]">Mira la tendencia de semanas; el peso varía a lo largo del día.</p>
        </section>
      )}

      <section className="card">
        <div className="card-h">
          <h3>Perfil</h3>
          <button type="button" className="btn quiet sm" onClick={sheets.profile}>
            Editar
          </button>
        </div>
        <dl className="kv">
          <div><dt>Cuerpo del mapa</dt><dd>{sex === "male" ? "Hombre" : sex === "female" ? "Mujer" : "Sin definir"}</dd></div>
          <div><dt>Altura</dt><dd>{height ? `${height} cm` : "Sin definir"}</dd></div>
          <div><dt>Objetivo</dt><dd>{GOAL_LABEL[goal]}</dd></div>
        </dl>
      </section>

      <section className="card">
        <div className="card-h">
          <h3>Historial</h3>
        </div>
        {[...entries].reverse().slice(0, 12).map((e) => (
          <button key={e.id} type="button" className="hist" onClick={() => sheets.entry(e.id)}>
            <span>
              <b>{e.weight.toLocaleString("es")} kg</b>
              <small>{[e.fat !== undefined && `${e.fat}% grasa`, e.muscle !== undefined && `${e.muscle}% músculo`, e.waist !== undefined && `${e.waist} cm cintura`].filter(Boolean).join(" · ") || "Solo peso"}</small>
            </span>
            <span className="muted">{dayLabel(e.date)}</span>
          </button>
        ))}
      </section>
    </>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { RadarChart } from "@/components/ui/radar-chart";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useToday } from "@/hooks/use-time-key";
import { dayLabel } from "@/lib/dates";
import { medalOf, muscleLoad, personalRecords, weekSummary } from "@/lib/gym";
import type { GymState } from "@/lib/types";
import { fmt } from "@/lib/utils";

interface LeftProps {
  gym: GymState;
  split: string;
  onStart: () => void;
}

/** Columna izquierda: resumen de la semana y el botón principal. */
export function GymLeft({ gym, split, onStart }: LeftProps) {
  const { today } = useToday();
  const w = weekSummary(gym, new Date(today + "T00:00:00"));
  return (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Esta semana</h3>
        </div>
        <div className="rings rings-sm">
          <Rings items={[{ r: 80, s: 16, c: "#ff8a2b", p: w.days / w.goal }]} label={`${w.days} de ${w.goal} días`} />
          <div className="rings-c">
            <b>
              {w.days}
              <small className="text-sm text-[var(--muted)]">/{w.goal}</small>
            </b>
            <span>días</span>
          </div>
        </div>
        <dl className="kv">
          <div>
            <dt>Volumen acumulado</dt>
            <dd>{fmt(w.volume)} kg</dd>
          </div>
          <div>
            <dt>Sesiones</dt>
            <dd>{w.sessions}</dd>
          </div>
          <div>
            <dt>Tiempo entrenado</dt>
            <dd>{w.mins} min</dd>
          </div>
        </dl>
      </section>
      <button type="button" className="btn primary big g-cta" onClick={onStart}>
        <Icon name="dumbbell" />
        {gym.active ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
      </button>
      {!gym.active && <p className="muted g-cta-sub">Empezarás con {split}.</p>}
    </>
  );
}

/** Columna derecha: récords personales y reparto del volumen por grupo muscular. */
export function GymRight({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const now = new Date(today + "T00:00:00");
  const prs = personalRecords(gym, now);
  const load = muscleLoad(gym, now);
  const [mode, setMode] = useState<"radar" | "bars">("radar");
  const maxVol = Math.max(...load.map((l) => l.volume), 1);
  const empty = load.every((l) => l.volume === 0 && l.sets === 0);

  return (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Récords personales</h3>
        </div>
        {prs.length ? (
          <ol className="pr-list">
            {prs.slice(0, 8).map((pr) => (
              <li key={pr.name}>
                <span className={`medal ${medalOf(pr.age)}`} title={`Récord de hace ${pr.age} días`}>
                  <Icon name="medal" />
                </span>
                <span className="pr-n">
                  <strong>{pr.name}</strong>
                  <small>{dayLabel(pr.date)}</small>
                </span>
                <span className="pr-v">
                  {pr.kind === "load" ? (
                    <>
                      <b>{Math.round(pr.e1rm)} kg</b>
                      <small>
                        {pr.kg} × {pr.reps}
                      </small>
                    </>
                  ) : (
                    <>
                      <b>{pr.reps} reps</b>
                      <small>peso corporal</small>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty">Tus récords aparecerán al registrar entrenos con peso.</div>
        )}
        {prs.length > 0 && <p className="muted text-[12px] mt-2">Valor = 1RM estimado. Medalla dorada: récord de los últimos 30 días; plata, 90; bronce, más antiguo.</p>}
      </section>

      <section className="card">
        <div className="card-h">
          <h3>Volumen por músculo</h3>
        </div>
        <Segmented
          label="Tipo de gráfica"
          options={[
            { value: "radar", label: "Radar" },
            { value: "bars", label: "Barras" },
          ]}
          value={mode}
          onChange={setMode}
          tight
          className="mb-3"
        />
        {empty ? (
          <div className="empty">Sin datos en los últimos 30 días.</div>
        ) : mode === "radar" ? (
          <RadarChart label="Volumen por grupo muscular" items={load.map((l) => ({ label: l.axis, value: l.volume || l.sets }))} />
        ) : (
          <ul className="vbars">
            {load.map((l) => (
              <li key={l.axis}>
                <span>{l.axis}</span>
                <div className="bar-t">
                  <i style={{ width: `${(l.volume / maxVol) * 100}%`, background: "linear-gradient(90deg,#ff6a2b,#ffb020)" }} />
                </div>
                <small>
                  {l.volume >= 1000 ? `${(l.volume / 1000).toLocaleString("es", { maximumFractionDigits: 1 })} t` : `${fmt(l.volume)} kg`} · {l.sets}s
                </small>
              </li>
            ))}
          </ul>
        )}
        <p className="muted text-[12px] mt-2">Últimos 30 días. Volumen = kg × repeticiones; el peso corporal solo cuenta en series.</p>
      </section>
    </>
  );
}

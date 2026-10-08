"use client";

import { useState } from "react";
import { AnatomyLazy } from "@/components/ui/anatomy-lazy";
import { Icon } from "@/components/ui/icon";
import { InfoTip } from "@/components/ui/info-tip";
import { RadarChart } from "@/components/ui/radar-chart";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useToday } from "@/hooks/use-time-key";
import { dayLabel } from "@/lib/dates";
import { loadLevel, RECOVERY_LABEL, recoveryOf, zoneLoads, type Recovery } from "@/lib/body";
import { ZONE_LABEL, type Zone } from "@/lib/exercises";
import { medalOf, muscleLoad, muscleOf, personalRecords, weekSummary } from "@/lib/gym";
import type { GymState } from "@/lib/types";
import { fmt } from "@/lib/utils";
import { bmiOf } from "./gym-body";

interface LeftProps {
  gym: GymState;
  split: string;
  onStart: () => void;
  onBody: () => void;
}

/** Columna izquierda: resumen de la semana, botón principal y un vistazo a tu cuerpo. */
export function GymLeft({ gym, split, onStart, onBody }: LeftProps) {
  const { today } = useToday();
  const w = weekSummary(gym, new Date(today + "T00:00:00"));
  const last = [...gym.body].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
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
          <div><dt>Volumen acumulado <InfoTip term="volumen" /></dt><dd>{fmt(w.volume)} kg</dd></div>
          <div><dt>Sesiones</dt><dd>{w.sessions}</dd></div>
          <div><dt>Tiempo entrenado</dt><dd>{w.mins} min</dd></div>
        </dl>
      </section>
      <button type="button" className="btn primary big g-cta" onClick={onStart}>
        <Icon name="dumbbell" />
        {gym.active ? "Continuar entrenamiento" : "Iniciar entrenamiento"}
      </button>
      {!gym.active && <p className="muted g-cta-sub">Empezarás con {split}.</p>}
      <button type="button" className="card body-mini" onClick={onBody}>
        <span className="muted">Mi cuerpo</span>
        {last ? (
          <b>
            {last.weight.toLocaleString("es")} kg
            {gym.profile.height ? <small> · IMC {bmiOf(last.weight, gym.profile.height).toLocaleString("es", { maximumFractionDigits: 1 })}</small> : null}
          </b>
        ) : (
          <b>Registrar mi peso</b>
        )}
      </button>
    </>
  );
}

const REC_COLOR: Record<Recovery, string> = { rest: "#ef5350", recovering: "#f5a524", ready: "#34c58b", idle: "#8296b0" };

/** Mapa del cuerpo: carga de los últimos 7 días o estado de recuperación de cada zona. */
function BodyCard({ gym, today }: { gym: GymState; today: string }) {
  const [mode, setMode] = useState<"load" | "recovery">("recovery");
  const now = new Date(today + "T00:00:00");
  const loads = zoneLoads(gym, now, 7, muscleOf);
  const fills: Partial<Record<Zone, string>> = {};
  const titles: Partial<Record<Zone, string>> = {};
  for (const l of loads) {
    const rec = recoveryOf(l);
    fills[l.zone] = mode === "load" ? (l.sets > 0 ? `hsl(${Math.round(24 - loadLevel(l) * 24)} ${Math.round(90 + loadLevel(l) * 5)}% ${Math.round(72 - loadLevel(l) * 22)}%)` : undefined) : rec === "idle" ? undefined : REC_COLOR[rec];
    titles[l.zone] = `${ZONE_LABEL[l.zone]}: ${Math.round(l.sets * 10) / 10} series esta semana · ${RECOVERY_LABEL[rec]}`;
  }
  const worked = loads.filter((l) => l.sets > 0).sort((a, b) => b.sets - a.sets).slice(0, 3);
  const resting = loads.filter((l) => ["rest", "recovering"].includes(recoveryOf(l)));
  const ready = loads.filter((l) => recoveryOf(l) === "ready").slice(0, 4);
  const sex = gym.profile.sex;

  return (
    <>
      <Segmented label="Qué ver en el cuerpo" options={[{ value: "recovery", label: "Recuperación" }, { value: "load", label: "Carga 7 días" }]} value={mode} onChange={setMode} tight className="mb-2" />
      <AnatomyLazy sex={sex} fills={fills} titles={titles} label="Mapa del cuerpo con las zonas trabajadas" />
      {mode === "recovery" ? (
        <div className="bm-leg">
          {(["rest", "recovering", "ready"] as const).map((r) => (
            <span key={r}><i style={{ background: REC_COLOR[r] }} />{r === "rest" ? "Descansar" : r === "recovering" ? "Recuperando" : "Lista"}</span>
          ))}
        </div>
      ) : (
        <div className="bm-leg"><span><i style={{ background: "hsl(24 90% 72%)" }} />Poco</span><span><i style={{ background: "hsl(0 95% 50%)" }} />Mucho</span></div>
      )}
      <ul className="bm-list">
        {resting.length > 0 && <li><b>Déjalos descansar:</b> {resting.map((l) => ZONE_LABEL[l.zone]).join(", ")}</li>}
        {ready.length > 0 && <li><b>Listos para entrenar:</b> {ready.map((l) => ZONE_LABEL[l.zone]).join(", ")}</li>}
        {worked.length > 0 && <li><b>Más trabajados:</b> {worked.map((l) => `${ZONE_LABEL[l.zone]} (${Math.round(l.sets)} series)`).join(", ")}</li>}
        {!worked.length && <li className="muted">Cuando registres entrenos verás aquí qué músculos trabajaste y cuáles descansar.</li>}
      </ul>
    </>
  );
}

/** Columna derecha: récords personales y reparto del trabajo por músculo. */
export function GymRight({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const now = new Date(today + "T00:00:00");
  const prs = personalRecords(gym, now);
  const load = muscleLoad(gym, now);
  const [mode, setMode] = useState<"body" | "radar">("body");
  const empty = load.every((l) => l.volume === 0 && l.sets === 0);

  return (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Récords personales</h3>
          <InfoTip term="pr" />
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
                      <small>{pr.kg} × {pr.reps}</small>
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
        {prs.length > 0 && <p className="muted text-[12px] mt-2">Valor = 1RM estimado <InfoTip term="1rm" />. Medalla dorada: récord de los últimos 30 días; plata, 90; bronce, más antiguo.</p>}
      </section>

      <section className="card">
        <div className="card-h">
          <h3>Tus músculos</h3>
        </div>
        <Segmented label="Tipo de gráfica" options={[{ value: "body", label: "Cuerpo" }, { value: "radar", label: "Radar" }]} value={mode} onChange={setMode} tight className="mb-3" />
        {mode === "body" ? (
          <BodyCard gym={gym} today={today} />
        ) : empty ? (
          <div className="empty">Sin datos en los últimos 30 días.</div>
        ) : (
          <>
            <RadarChart label="Volumen por grupo muscular" items={load.map((l) => ({ label: l.axis, value: l.volume || l.sets }))} />
            <p className="muted text-[12px] mt-2">Últimos 30 días. Volumen = kg × repeticiones; el peso corporal solo cuenta en series.</p>
          </>
        )}
      </section>
    </>
  );
}

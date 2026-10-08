"use client";

import { Icon } from "@/components/ui/icon";
import { InfoTip } from "@/components/ui/info-tip";
import { Rings } from "@/components/ui/rings";
import { useToday } from "@/hooks/use-time-key";
import { dayLabel } from "@/lib/dates";
import { medalOf, personalRecords, weekSummary } from "@/lib/gym";
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

/** Columna derecha: récords personales. */
export function GymRight({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const now = new Date(today + "T00:00:00");
  const prs = personalRecords(gym, now);

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
    </>
  );
}

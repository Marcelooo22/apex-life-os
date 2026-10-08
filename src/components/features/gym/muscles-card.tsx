"use client";

import { useState } from "react";
import { AnatomyLazy } from "@/components/ui/anatomy-lazy";
import { InfoTip } from "@/components/ui/info-tip";
import { RadarChart } from "@/components/ui/radar-chart";
import { Segmented } from "@/components/ui/segmented";
import { useToday } from "@/hooks/use-time-key";
import { loadLevel, RECOVERY_LABEL, recoveryOf, zoneLoads, type Recovery } from "@/lib/body";
import { ZONE_LABEL, type Zone } from "@/lib/exercises";
import { muscleLoad, muscleOf } from "@/lib/gym";
import type { GymState } from "@/lib/types";

const REC_COLOR: Record<Recovery, string> = { rest: "#ff5a5f", recovering: "#ffb020", ready: "#34d399", idle: "#5c6f93" };

/** Mapa del cuerpo: carga de los últimos 7 días o estado de recuperación de cada zona. */
export function BodyCard({ gym, today }: { gym: GymState; today: string }) {
  const [mode, setMode] = useState<"load" | "recovery">("recovery");
  const now = new Date(today + "T00:00:00");
  const loads = zoneLoads(gym, now, 7, muscleOf);
  const fills: Partial<Record<Zone, string>> = {};
  const titles: Partial<Record<Zone, string>> = {};
  for (const l of loads) {
    const rec = recoveryOf(l);
    fills[l.zone] = mode === "load" ? (l.sets > 0 ? `hsl(${Math.round(24 - loadLevel(l) * 24)} ${Math.round(90 + loadLevel(l) * 5)}% ${Math.round(72 - loadLevel(l) * 22)}%)` : undefined) : rec === "idle" ? undefined : REC_COLOR[rec];
    titles[l.zone] = `${Math.round(l.sets * 10) / 10} series esta semana · ${RECOVERY_LABEL[rec]}`;
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

/** Tarjeta grande "Tus músculos": cuerpo con recuperación o carga, o radar. Pasa el cursor por un músculo para ver cuál es. */
export function MusclesCard({ gym }: { gym: GymState }) {
  const { today } = useToday();
  const now = new Date(today + "T00:00:00");
  const load = muscleLoad(gym, now);
  const [mode, setMode] = useState<"body" | "radar">("body");
  const empty = load.every((l) => l.volume === 0 && l.sets === 0);
  return (
    <section className="card muscles">
      <div className="card-h">
        <h3>Tus músculos</h3>
        <InfoTip term="recuperacion" />
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
  );
}

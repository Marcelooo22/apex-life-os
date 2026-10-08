"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { ActiveWorkoutCard } from "./active-workout-card";
import { GymBody } from "./gym-body";
import { GymCalendar } from "./gym-calendar";
import { GymHeatmap } from "./gym-heatmap";
import { GymHero } from "./gym-hero";
import { GymHistory } from "./gym-history";
import { GymLeft, GymRight } from "./gym-side";
import { openWorkout } from "@/lib/focus";
import { startWorkout } from "./start";
import { StartWorkoutCard } from "./start-workout-card";
import { useGymSheets } from "./use-gym-sheets";

type Tab = "today" | "month" | "year" | "body";
const TABS = [
  { value: "today" as Tab, label: "Hoy" },
  { value: "month" as Tab, label: "Historial" },
  { value: "year" as Tab, label: "Trayectoria" },
  { value: "body" as Tab, label: "Mi cuerpo" },
];

/** Sección "Iron": centro de rendimiento con rutina en vivo, historial y mapa de calor anual. */
export function GymView() {
  const { gym } = useAppState();
  const sheets = useGymSheets();
  const [tab, setTab] = useState<Tab>("today");
  const [split, setSplit] = useState(() => Object.keys(gym.routines)[0] ?? "Push");
  const [month, setMonth] = useState(0);
  const current = gym.routines[split] ? split : (Object.keys(gym.routines)[0] ?? split);

  const start = () => {
    setTab("today");
    if (gym.active) openWorkout();
    else startWorkout(gym, current);
  };

  return (
    <ViewShell
      assistant="gym"
      title="Gym"
      header={<GymHero gym={gym} />}
      action={{ label: "Ajustes del gym", onClick: sheets.settings }}
      columns={{
        left: <GymLeft gym={gym} split={current} onStart={start} onBody={() => setTab("body")} />,
        right: <GymRight gym={gym} />,
        labels: ["Resumen", "Entreno", "Récords"],
      }}
    >
      <Segmented label="Vista" options={TABS} value={tab} onChange={setTab} tight className="mb-3.5" />
      {tab === "today" &&
        (gym.active ? <ActiveWorkoutCard workout={gym.active} gym={gym} /> : <StartWorkoutCard gym={gym} split={current} onSplit={setSplit} />)}
      {tab === "month" && (
        <>
          <GymCalendar gym={gym} month={month} onMonth={setMonth} />
          <GymHistory sessions={gym.sessions} />
        </>
      )}
      {tab === "year" && <GymHeatmap gym={gym} />}
      {tab === "body" && <GymBody gym={gym} />}
    </ViewShell>
  );
}

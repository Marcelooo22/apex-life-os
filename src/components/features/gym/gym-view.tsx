"use client";

import { ViewShell } from "@/components/layout/view-shell";
import { useAppState } from "@/hooks/use-app-state";
import { useState } from "react";
import { ActiveWorkoutCard } from "./active-workout-card";
import { GymCalendar } from "./gym-calendar";
import { GymHistory } from "./gym-history";
import { StartWorkoutCard } from "./start-workout-card";
import { useGymSheets } from "./use-gym-sheets";

/** Sección "Iron": entrenos, series, récords y calendario. */
export function GymView() {
  const { gym } = useAppState();
  const sheets = useGymSheets();
  const [split, setSplit] = useState(() => Object.keys(gym.routines)[0] ?? "Push");
  const [month, setMonth] = useState(0);

  return (
    <ViewShell
      title="Iron"
      subtitle="Sobrecarga progresiva. Cada serie cuenta."
      action={{ label: "Ajustes del gym", onClick: sheets.settings }}
    >
      {gym.active ? <ActiveWorkoutCard workout={gym.active} gym={gym} /> : <StartWorkoutCard gym={gym} split={split} onSplit={setSplit} />}
      <GymCalendar gym={gym} month={month} onMonth={setMonth} />
      <GymHistory sessions={gym.sessions} />
    </ViewShell>
  );
}

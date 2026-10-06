"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-time-key";
import { SLOTS } from "@/lib/constants";
import { coachTips, rate, streak } from "@/lib/habits";
import { updateState } from "@/lib/store";
import type { Slot } from "@/lib/types";
import { cn, haptic } from "@/lib/utils";
import { HabitRow } from "./habit-row";
import { useHabitSheet } from "./use-habit-sheet";

type SlotFilter = "all" | Slot;
const SLOT_OPTIONS = [{ value: "all" as SlotFilter, label: "Todos" }, ...SLOTS.map(([value, label]) => ({ value: value as SlotFilter, label }))];
const SLEEP_CHOICES = [5, 6, 7, 8, 9];

/** Sección "Hábitos": check diario, rachas, sueño y consejos del coach. */
export function HabitsView() {
  const state = useAppState();
  const { today } = useToday();
  const openHabitSheet = useHabitSheet();
  const [slot, setSlot] = useState<SlotFilter>("all");
  const [tipIndex, setTipIndex] = useState(0);

  const habits = state.habits.list;
  const done = habits.filter((h) => h.log[today]).length;
  const visible = habits.filter((h) => slot === "all" || h.slot === slot);
  const bestStreak = habits.reduce((max, h) => Math.max(max, streak(h)), 0);
  const weekRate = habits.length ? Math.round((habits.reduce((sum, h) => sum + rate(h, 7), 0) / habits.length) * 100) : 0;
  const tips = coachTips(state);
  const tip = tips[tipIndex % tips.length];
  const sleep = state.habits.sleep[today];
  const percent = habits.length ? Math.round((done / habits.length) * 100) : 0;

  const toggleHabit = (id: string) => {
    const key = today;
    const target = habits.find((h) => h.id === id);
    if (!target) return;
    if (!target.log[key]) haptic(15);
    updateState((d) => {
      const h = d.habits.list.find((x) => x.id === id);
      if (!h) return;
      if (h.log[key]) delete h.log[key];
      else h.log[key] = true;
    });
    setTipIndex(0);
  };

  const setSleep = (hours: number) => {
    updateState((d) => {
      if (d.habits.sleep[today] === hours) delete d.habits.sleep[today];
      else d.habits.sleep[today] = hours;
    });
    setTipIndex(0);
  };

  return (
    <ViewShell title="Hábitos" subtitle="Sin límites y sin suscripción." fab={{ label: "Hábito", onClick: () => openHabitSheet() }}>
      <section className="card sum">
        <div className="rings">
          <Rings items={[{ r: 80, s: 18, c: "#34f5a4", p: habits.length ? done / habits.length : 0 }]} label={`${done} de ${habits.length} hábitos hoy`} />
          <div className="rings-c">
            <b>{percent}%</b>
          </div>
        </div>
        <div>
          <h3>
            {done} de {habits.length} hoy
          </h3>
          <p>{bestStreak ? `Mejor racha activa: ${bestStreak} ${bestStreak === 1 ? "día" : "días"}` : "Marca uno para empezar tu racha"}</p>
          <p>Cumplimiento 7 días: {weekRate}%</p>
        </div>
      </section>

      <section className="card coach">
        <span className="src">Coach, según tus datos de hoy</span>
        <h4>{tip?.h}</h4>
        <p>{tip?.b}</p>
        {tips.length > 1 && (
          <button type="button" className="btn quiet sm mt-2 p-0 text-[#8fe9c4]" onClick={() => setTipIndex((i) => i + 1)}>
            Otro consejo
          </button>
        )}
        <div className="sleep">
          <span>¿Cuántas horas dormiste anoche?</span>
          <div className="chips">
            {SLEEP_CHOICES.map((n) => (
              <button key={n} type="button" className={cn("chip", sleep === n && "on")} onClick={() => setSleep(n)} aria-pressed={sleep === n}>
                {n === 5 ? "≤5" : n === 9 ? "9+" : n} h
              </button>
            ))}
          </div>
        </div>
      </section>

      <Segmented label="Momento del día" options={SLOT_OPTIONS} value={slot} onChange={setSlot} className="mb-3.5" />

      {visible.length === 0 && (
        <div className="empty">
          {habits.length ? "No hay hábitos en este momento del día." : "Aún no tienes hábitos."}
          <br />
          Toca el botón + para crear uno.
        </div>
      )}
      {visible.map((habit) => (
        <HabitRow key={habit.id} habit={habit} today={today} onToggle={toggleHabit} onEdit={openHabitSheet} />
      ))}
    </ViewShell>
  );
}

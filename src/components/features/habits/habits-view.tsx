"use client";

import { useState } from "react";
import { ViewShell } from "@/components/layout/view-shell";
import { Icon } from "@/components/ui/icon";
import { Rings } from "@/components/ui/rings";
import { Segmented } from "@/components/ui/segmented";
import { useAppState } from "@/hooks/use-app-state";
import { useToday } from "@/hooks/use-time-key";
import { HABIT_CATEGORIES, SLOTS, WEEKDAYS } from "@/lib/constants";
import { addDays, dkey } from "@/lib/dates";
import { coachTips, dayCompletion, rate, streak, weekdayIndex } from "@/lib/habits";
import { updateState } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { HabitCategory, Slot } from "@/lib/types";
import { cn, haptic } from "@/lib/utils";
import { HabitCard } from "./habit-card";
import { useHabitSheet } from "./use-habit-sheet";

type SlotFilter = "all" | Slot;
const SLOT_OPTIONS = [{ value: "all" as SlotFilter, label: "Todos" }, ...SLOTS.map(([value, label]) => ({ value: value as SlotFilter, label }))];
const SLEEP_CHOICES = [5, 6, 7, 8, 9];

/** Sección "Hábitos": rachas globales, tarjetas con anillos y consistencia semanal. */
export function HabitsView() {
  const state = useAppState();
  const { today } = useToday();
  const openHabitSheet = useHabitSheet();
  const [slot, setSlot] = useState<SlotFilter>("all");
  const [category, setCategory] = useState<"all" | HabitCategory>("all");
  const [tipIndex, setTipIndex] = useState(0);

  const now = new Date(today + "T00:00:00");
  const habits = state.habits.list;
  const done = habits.filter((h) => h.log[today]).length;
  const visible = habits.filter((h) => (slot === "all" || h.slot === slot) && (category === "all" || h.category === category));
  const bestStreak = habits.reduce((max, h) => Math.max(max, streak(h, now)), 0);
  const avg30 = habits.length ? Math.round((habits.reduce((s, h) => s + rate(h, 30, now), 0) / habits.length) * 100) : 0;
  const tips = coachTips(state, now);
  const tip = tips[tipIndex % tips.length];
  const sleep = state.habits.sleep[today];
  const percent = habits.length ? Math.round((done / habits.length) * 100) : 0;
  const week = Array.from({ length: 7 }, (_, i) => addDays(now, i - 6)).map((d) => ({ d, ...dayCompletion(habits, d) }));
  const weekAvg = Math.round((week.reduce((s, w) => s + w.p, 0) / 7) * 100);

  const toggleHabit = (id: string) => {
    const target = habits.find((h) => h.id === id);
    if (!target) return;
    if (target.link === "gym" || target.link === "water") {
      toast(target.link === "gym" ? "Se marca solo al terminar un entreno" : "Se marca solo al cumplir la meta de agua");
      return;
    }
    if (!target.log[today]) haptic(15);
    updateState((d) => {
      const h = d.habits.list.find((x) => x.id === id);
      if (!h) return;
      if (h.log[today]) delete h.log[today];
      else h.log[today] = true;
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

  const left = (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Rachas</h3>
        </div>
        <dl className="kv">
          <div>
            <dt>Mejor racha activa</dt>
            <dd className="kv-flame">
              <Icon name="flame" />
              {bestStreak}
            </dd>
          </div>
          <div>
            <dt>Hábitos activos</dt>
            <dd>{habits.length}</dd>
          </div>
          <div>
            <dt>Cumplimiento 30 días</dt>
            <dd>{avg30}%</dd>
          </div>
        </dl>
      </section>
      <section className="card">
        <div className="card-h">
          <h3>Categorías</h3>
        </div>
        <div className="cat-list">
          <button type="button" className={cn("cat", category === "all" && "on")} onClick={() => setCategory("all")} aria-pressed={category === "all"}>
            <Icon name="habits" />
            <span>Todas</span>
            <b>{habits.length}</b>
          </button>
          {HABIT_CATEGORIES.map((c) => {
            const count = habits.filter((h) => h.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                className={cn("cat", category === c.id && "on")}
                aria-pressed={category === c.id}
                onClick={() => setCategory(category === c.id ? "all" : c.id)}
                style={{ "--cat": c.rgb } as React.CSSProperties}
                disabled={!count && category !== c.id}
              >
                <Icon name={c.icon} />
                <span>{c.label}</span>
                <b>{count}</b>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );

  const right = (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Consistencia semanal</h3>
          <b className="wk-avg">{weekAvg}%</b>
        </div>
        <div className="wk" role="img" aria-label={`Cumplimiento de los últimos 7 días: ${weekAvg}% de media`}>
          {week.map(({ d, p, done: n, total }) => (
            <div key={dkey(d)} className={cn("wk-d", dkey(d) === today && "t")}>
              <div className="wk-bar" title={`${n} de ${total}`}>
                <i style={{ height: `${Math.max(p * 100, total ? 6 : 0)}%` }} />
              </div>
              <span>{WEEKDAYS[weekdayIndex(d)]?.short}</span>
            </div>
          ))}
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
    </>
  );

  return (
    <ViewShell
      title="Hábitos"
      subtitle="Sin límites y sin suscripción."
      fab={{ label: "Hábito", onClick: () => openHabitSheet() }}
      columns={{ left, right, labels: ["Rachas", "Hábitos", "Semana"] }}
    >
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
        </div>
      </section>

      <Segmented label="Momento del día" options={SLOT_OPTIONS} value={slot} onChange={setSlot} className="mb-3.5" />

      {visible.length === 0 && (
        <div className="empty">
          {habits.length ? "No hay hábitos con este filtro." : "Aún no tienes hábitos."}
          <br />
          Toca el botón + para crear uno.
        </div>
      )}
      <div className="hc-grid">
        {visible.map((habit) => (
          <HabitCard key={habit.id} habit={habit} today={today} onToggle={toggleHabit} onEdit={openHabitSheet} />
        ))}
      </div>
    </ViewShell>
  );
}

import { ALL_DAYS } from "./constants";
import { addDays, dkey, weekStart } from "./dates";
import type { AppState, Habit } from "./types";

/** 0 = lunes … 6 = domingo. */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export const habitDays = (h: Habit): readonly number[] => (h.days?.length ? h.days : ALL_DAYS);
export const isScheduled = (h: Habit, d: Date) => habitDays(h).includes(weekdayIndex(d));
export const everyDay = (h: Habit) => habitDays(h).length === 7;

/**
 * Racha de días programados cumplidos seguidos. Los días en que el hábito no aplica
 * no la rompen, y si hoy aún está pendiente se cuenta desde ayer.
 */
export function streak(h: Habit, now: Date = new Date()) {
  let d = now;
  let n = 0;
  for (let i = 0; i < 1100; i++) {
    const done = !!h.log[dkey(d)];
    if (done) n++;
    else if (isScheduled(h, d)) {
      if (i > 0) break;
    }
    d = addDays(d, -1);
  }
  return n;
}

/** Cumplimiento de los últimos N días sobre los días en que el hábito aplicaba. */
export function rate(h: Habit, days = 30, now: Date = new Date()) {
  let total = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(now, -i);
    const k = dkey(d);
    if (k < h.created) break;
    const did = !!h.log[k];
    if (isScheduled(h, d) || did) {
      total++;
      if (did) done++;
    }
  }
  return total ? done / total : 0;
}

/** Días programados desde que se creó el hábito (máx. 30). */
export function daysTracked(h: Habit, now: Date = new Date()) {
  let t = 0;
  for (let i = 0; i < 30; i++) {
    const d = addDays(now, -i);
    if (dkey(d) < h.created) break;
    if (isScheduled(h, d) || h.log[dkey(d)]) t++;
  }
  return t;
}

/** Progreso de la semana actual (lunes a domingo): hechos / programados. */
export function weekProgress(h: Habit, now: Date = new Date()) {
  const start = weekStart(now);
  let planned = 0;
  let done = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const did = !!h.log[dkey(d)];
    if (isScheduled(h, d) || did) {
      planned++;
      if (did) done++;
    }
  }
  return { done, planned, p: planned ? Math.min(1, done / planned) : 0 };
}

/** Intensidad de la llama según la racha (0 = apagada … 5 = máxima). */
export function flameTier(days: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (days >= 30) return 5;
  if (days >= 14) return 4;
  if (days >= 7) return 3;
  if (days >= 3) return 2;
  return days >= 1 ? 1 : 0;
}

/** Hábitos que aplican en un día y cuántos se cumplieron (para el gráfico semanal). */
export function dayCompletion(habits: readonly Habit[], date: Date) {
  const key = dkey(date);
  const relevant = habits.filter((h) => h.created <= key && (isScheduled(h, date) || h.log[key]));
  const done = relevant.filter((h) => h.log[key]).length;
  return { done, total: relevant.length, p: relevant.length ? done / relevant.length : 0 };
}

/** "07:30" → minutos desde medianoche (o null si no es válida). */
export const timeToMinutes = (time: string | undefined): number | null => {
  const m = /^(\d{2}):(\d{2})$/.exec(time ?? "");
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
};

export const formatTime = (time: string | undefined) => {
  const mins = timeToMinutes(time);
  if (mins === null) return "";
  return new Date(2000, 0, 1, Math.floor(mins / 60), mins % 60).toLocaleTimeString("es", { hour: "numeric", minute: "2-digit" });
};

export interface Tip {
  h: string;
  b: string;
}

/** Consejos del "coach" según los datos de hoy. */
export function coachTips(state: AppState, now: Date = new Date()): Tip[] {
  const tips: Tip[] = [];
  const today = dkey(now);
  const hour = now.getHours();
  const list = state.habits.list;
  if (!list.length)
    return [{ h: "Empieza con uno", b: "Crea un solo hábito y hazlo tan fácil que sea imposible fallar. Dos minutos cuentan." }];

  const sleep = state.habits.sleep[today];
  const day = state.nutrition.days[today];
  const water = day ? day.water : 0;
  const goalWater = state.nutrition.goals.water;
  const dueToday = list.filter((h) => isScheduled(h, now) || h.log[today]);
  const pending = dueToday.filter((h) => !h.log[today]);

  if (sleep && sleep <= 6)
    tips.push({
      h: "Dormiste poco",
      b: `Con ${sleep} h, hoy rinde más proteger lo básico que perseguirlo todo. Elige un hábito clave y deja el resto para mañana.`,
    });
  if (sleep && sleep >= 8 && pending.length)
    tips.push({ h: "Buen descanso", b: "Dormir bien es el mejor momento para el hábito que más te cuesta. Aprovéchalo ahora." });
  if (hour >= 14 && water / goalWater < 0.5)
    tips.push({
      h: "Hidratación atrasada",
      b: `Llevas ${(water / 1000).toFixed(2)} L de ${(goalWater / 1000).toFixed(1)} L. Una botella ahora te pone al día.`,
    });

  const weak = list
    .filter((h) => daysTracked(h, now) >= 5)
    .sort((a, b) => rate(a, 30, now) - rate(b, 30, now))[0];
  if (weak && rate(weak, 30, now) < 0.6)
    tips.push({
      h: `"${weak.name}" necesita ayuda`,
      b: `Va en ${Math.round(rate(weak, 30, now) * 100)}%. Engánchalo a algo que ya haces (después del café, al cepillarte) y redúcelo a su versión de dos minutos.`,
    });

  list.forEach((h) => {
    const s = streak(h, now);
    if (!h.log[today] && isScheduled(h, now) && s >= 3)
      tips.push({ h: `Cuida tu racha de ${s} días`, b: `"${h.name}" sigue activo. Hacerlo hoy es lo único que lo mantiene.` });
    if (h.log[today] && [7, 14, 21, 30, 60, 100].includes(s))
      tips.push({ h: `${s} días seguidos`, b: `Llevas ${s} días con "${h.name}". Eso ya es identidad, no solo disciplina.` });
  });

  if (hour >= 19 && pending.length)
    tips.push({ h: `Quedan ${pending.length} por hacer`, b: `Aún estás a tiempo: ${pending.slice(0, 2).map((h) => h.name).join(" y ")}.` });
  if (!dueToday.length) tips.push({ h: "Día libre", b: "Hoy no tienes hábitos programados. Descansar también es parte del sistema." });
  else if (!pending.length) tips.push({ h: "Día completo", b: "Todos tus hábitos de hoy están hechos. Lo importante ahora es repetirlo mañana." });
  if (!tips.length) tips.push({ h: "Vas bien", b: "Mantén el ritmo. Marca cada hábito apenas lo hagas, no al final del día." });
  return tips;
}

/** Texto corto con los días de un hábito: "Todos los días", "L–V", "L M X". */
export function daysLabel(h: Habit): string {
  const days = habitDays(h);
  if (days.length === 7) return "Todos los días";
  const letters = ["L", "M", "X", "J", "V", "S", "D"];
  if (days.length === 5 && days.every((d, i) => d === i)) return "Entre semana";
  if (days.length === 2 && days[0] === 5 && days[1] === 6) return "Fines de semana";
  return days.map((d) => letters[d]).join(" ");
}


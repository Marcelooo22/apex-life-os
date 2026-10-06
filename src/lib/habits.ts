import { addDays, dkey } from "./dates";
import type { AppState, Habit } from "./types";

export function streak(h: Habit, now: Date = new Date()) {
  let d = now;
  if (!h.log[dkey(d)]) d = addDays(d, -1);
  let n = 0;
  while (h.log[dkey(d)]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Cumplimiento de los últimos N días (desde que se creó el hábito). */
export function rate(h: Habit, days = 30, now: Date = new Date()) {
  let total = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const k = dkey(addDays(now, -i));
    if (k < h.created) break;
    total++;
    if (h.log[k]) done++;
  }
  return total ? done / total : 0;
}

export function daysTracked(h: Habit, now: Date = new Date()) {
  let t = 0;
  for (let i = 0; i < 30; i++) {
    if (dkey(addDays(now, -i)) < h.created) break;
    t++;
  }
  return t;
}

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
  const pending = list.filter((h) => !h.log[today]);

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
    if (!h.log[today] && s >= 3)
      tips.push({ h: `Cuida tu racha de ${s} días`, b: `"${h.name}" sigue activo. Hacerlo hoy es lo único que lo mantiene.` });
    if (h.log[today] && [7, 14, 21, 30, 60, 100].includes(s))
      tips.push({ h: `${s} días seguidos`, b: `Llevas ${s} días con "${h.name}". Eso ya es identidad, no solo disciplina.` });
  });

  if (hour >= 19 && pending.length)
    tips.push({ h: `Quedan ${pending.length} por hacer`, b: `Aún estás a tiempo: ${pending.slice(0, 2).map((h) => h.name).join(" y ")}.` });
  if (!pending.length) tips.push({ h: "Día completo", b: "Todos tus hábitos están hechos. Lo importante ahora es repetirlo mañana." });
  if (!tips.length) tips.push({ h: "Vas bien", b: "Mantén el ritmo. Marca cada hábito apenas lo hagas, no al final del día." });
  return tips;
}

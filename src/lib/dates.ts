import { cap, pad } from "./utils";

/** Clave de día "AAAA-MM-DD" en hora local. */
export const dkey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (key: string) => {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

/** Lunes de la semana actual. */
export const weekStart = (now: Date = new Date()) => {
  const x = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

export const dayLabel = (key: string) =>
  cap(parseKey(key).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }));

export const longDate = (d: Date = new Date()) =>
  cap(d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }));

/** Cronómetro "mm:ss" o "h:mm:ss". */
export const formatDuration = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s % 60);
};

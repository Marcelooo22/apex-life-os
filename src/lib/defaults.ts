import { sanitizeCustomModule } from "./custom";
import { dkey } from "./dates";
import type { AppState, Habit, Instrument, Song, SongStatus } from "./types";

export const defaults = (): AppState => ({
  v: 2,
  name: "",
  gym: {
    goal: 4,
    rest: 90,
    effort: "RPE",
    marks: {},
    sessions: [],
    active: null,
    routines: {
      Push: ["Press banca", "Press militar", "Fondos", "Extensión de tríceps"],
      Pull: ["Dominadas", "Remo con barra", "Curl de bíceps"],
      Legs: ["Sentadilla", "Peso muerto rumano", "Prensa", "Gemelos"],
    },
  },
  habits: {
    list: [
      { id: "h1", name: "Agua al despertar", slot: "morning", created: dkey(), log: {}, category: "health", link: "none" },
      { id: "h2", name: "Entrenar", slot: "afternoon", created: dkey(), log: {}, category: "body", link: "gym" },
      { id: "h3", name: "Skincare de noche", slot: "night", created: dkey(), log: {}, category: "health", link: "none" },
    ],
    sleep: {},
  },
  nutrition: { goals: { kcal: 2400, p: 160, c: 260, f: 70, water: 3000 }, days: {} },
  hobbies: {
    instruments: [
      {
        id: "i-aco",
        name: "Acordeón",
        detail: "Cinco Letras / GCF",
        songs: [
          {
            id: "s1",
            title: "La Gota Fría",
            artist: "Carlos Vives / Emiliano Zuleta",
            genre: "Paseo",
            key: "Sol Mayor (G)",
            bpmTarget: 110,
            bpmCurrent: 90,
            status: "En práctica",
            link: "",
            notes: "Cuidar el fuelleo y bajos",
          },
        ],
      },
      { id: "i-sax", name: "Saxofón", detail: "Alto en Mib", songs: [] },
      { id: "i-gui", name: "Guitarra Eléctrica", detail: "Afinación estándar", songs: [] },
    ],
  },
  uni: { subjects: [], tasks: [], scale: 10, semester: null, notes: "", focus: {} },
  custom: [],
});

/* ===================== Migraciones de datos guardados ===================== */
/** Estados antiguos de las canciones → los tres estados actuales. */
const OLD_SONG_STATUS: Record<string, SongStatus> = {
  "Por aprender": "Por aprender",
  "En proceso": "En práctica",
  Afinación: "En práctica",
  Velocidad: "En práctica",
  Completada: "Dominada",
  "En práctica": "En práctica",
  Dominada: "Dominada",
};

const GYM_HABIT = /^(entrenar|entreno|entrenamiento|gym|ir al gym|ir al gimnasio|hacer ejercicio|ejercicio)\b/i;
const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function migrateHabit(h: Habit): Habit {
  let next = h;
  // Los hábitos de entrenar se completan solos al terminar un entreno (solo la primera vez).
  if (h.link === undefined && GYM_HABIT.test(plain(h.name))) next = { ...next, link: "gym" };
  if (h.days) {
    const days = [...new Set(h.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    next = { ...next, days: days.length ? days : undefined };
  }
  return next;
}

function migrateInstrument(i: Instrument): Instrument {
  return {
    ...i,
    songs: i.songs.map(
      (s): Song => ({ ...s, status: OLD_SONG_STATUS[s.status as string] ?? "Por aprender" }),
    ),
  };
}

/**
 * Mezcla lo guardado en el dispositivo con los valores por defecto, de forma que
 * copias antiguas (o incompletas) sigan funcionando al añadir campos nuevos.
 */
export function hydrate(saved: unknown): AppState {
  const d = defaults();
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<AppState>;
  const habits = { ...d.habits, ...(s.habits ?? {}) };
  const instruments = (s.hobbies?.instruments ?? d.hobbies.instruments).map(migrateInstrument);
  const custom = Array.isArray(s.custom)
    ? s.custom.map(sanitizeCustomModule).filter((m): m is NonNullable<typeof m> => m !== null)
    : [];

  return {
    ...d,
    ...s,
    gym: { ...d.gym, ...(s.gym ?? {}) },
    habits: { ...habits, list: habits.list.map(migrateHabit) },
    nutrition: {
      ...d.nutrition,
      ...(s.nutrition ?? {}),
      goals: { ...d.nutrition.goals, ...(s.nutrition?.goals ?? {}) },
    },
    hobbies: { ...d.hobbies, ...(s.hobbies ?? {}), instruments },
    uni: { ...d.uni, ...(s.uni ?? {}) },
    custom,
  };
}

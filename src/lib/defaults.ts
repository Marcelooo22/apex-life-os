import { dkey } from "./dates";
import type { AppState } from "./types";

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
      { id: "h1", name: "Agua al despertar", slot: "morning", created: dkey(), log: {} },
      { id: "h2", name: "Entrenar", slot: "afternoon", created: dkey(), log: {} },
      { id: "h3", name: "Skincare de noche", slot: "night", created: dkey(), log: {} },
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
            status: "Velocidad",
            link: "",
            notes: "Cuidar el fuelleo y bajos",
          },
        ],
      },
      { id: "i-sax", name: "Saxofón", detail: "Alto en Mib", songs: [] },
      { id: "i-gui", name: "Guitarra Eléctrica", detail: "Afinación estándar", songs: [] },
    ],
  },
  uni: { subjects: [], tasks: [] },
});

/**
 * Mezcla lo guardado en el dispositivo con los valores por defecto, de forma que
 * copias antiguas (o incompletas) sigan funcionando al añadir campos nuevos.
 */
export function hydrate(saved: unknown): AppState {
  const d = defaults();
  if (!saved || typeof saved !== "object") return d;
  const s = saved as Partial<AppState>;
  return {
    ...d,
    ...s,
    gym: { ...d.gym, ...(s.gym ?? {}) },
    habits: { ...d.habits, ...(s.habits ?? {}) },
    nutrition: {
      ...d.nutrition,
      ...(s.nutrition ?? {}),
      goals: { ...d.nutrition.goals, ...(s.nutrition?.goals ?? {}) },
    },
    hobbies: {
      ...d.hobbies,
      ...(s.hobbies ?? {}),
      instruments: s.hobbies?.instruments ?? d.hobbies.instruments,
    },
    uni: { ...d.uni, ...(s.uni ?? {}) },
  };
}

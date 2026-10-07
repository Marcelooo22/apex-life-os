import { findExercise } from "./exercises";

export interface Program {
  id: string;
  name: string;
  days: number;
  level: "Principiante" | "Intermedio" | "Avanzado";
  blurb: string;
  /** Divisiones del programa con sus ejercicios (nombres del catálogo). */
  splits: Record<string, string[]>;
}

const P = (id: string, name: string, days: number, level: Program["level"], blurb: string, splits: Record<string, string[]>): Program => ({ id, name, days, level, blurb, splits });

export const PROGRAMS: readonly Program[] = [
  P("ppl", "PPL (Empuje, Tirón, Pierna)", 6, "Intermedio", "Empuje, tirón y pierna, dos vueltas por semana (o 3 días si empiezas).", {
    Push: ["Press banca con barra", "Press inclinado con mancuernas", "Press de hombro con mancuernas", "Elevaciones laterales", "Extensión de tríceps en polea"],
    Pull: ["Dominadas", "Remo con barra", "Jalón al pecho", "Face pull", "Curl con barra"],
    Legs: ["Sentadilla con barra", "Peso muerto rumano", "Prensa de piernas", "Curl femoral tumbado", "Elevación de gemelos de pie"],
  }),
  P("arnold", "Arnold Split", 6, "Avanzado", "Pecho y espalda juntos, hombros y brazos, piernas. Mucho volumen, para quien ya tiene base.", {
    "Pecho y espalda": ["Press banca con barra", "Press inclinado con mancuernas", "Aperturas con mancuernas", "Dominadas", "Remo con barra", "Pull-over con mancuerna"],
    "Hombros y brazos": ["Press militar con barra", "Elevaciones laterales", "Pájaros (vuelos posteriores)", "Curl con barra", "Press francés", "Curl martillo"],
    Piernas: ["Sentadilla con barra", "Zancadas", "Extensión de cuádriceps", "Curl femoral tumbado", "Elevación de gemelos de pie", "Plancha"],
  }),
  P("ppl-arnold", "PPL × Arnold (híbrido)", 5, "Intermedio", "Empuje, tirón y pierna, más un día de pecho/espalda y otro de hombros/brazos.", {
    Push: ["Press banca con barra", "Press inclinado con mancuernas", "Elevaciones laterales", "Extensión de tríceps en polea"],
    Pull: ["Dominadas", "Remo con barra", "Jalón al pecho", "Curl con mancuernas"],
    Legs: ["Sentadilla con barra", "Peso muerto rumano", "Prensa de piernas", "Elevación de gemelos de pie"],
    "Pecho y espalda": ["Press inclinado con barra", "Remo con mancuerna", "Aperturas con mancuernas", "Jalón al pecho"],
    "Hombros y brazos": ["Press de hombro con mancuernas", "Elevaciones laterales", "Curl martillo", "Press francés"],
  }),
  P("upper-lower", "Torso / Pierna", 4, "Principiante", "Cuatro días: dos de tren superior y dos de inferior. Equilibrado y fácil de seguir.", {
    "Torso A": ["Press banca con barra", "Remo con barra", "Press de hombro con mancuernas", "Jalón al pecho", "Curl con mancuernas", "Extensión de tríceps en polea"],
    "Pierna A": ["Sentadilla con barra", "Peso muerto rumano", "Extensión de cuádriceps", "Elevación de gemelos de pie", "Plancha"],
    "Torso B": ["Press inclinado con mancuernas", "Remo en polea baja", "Elevaciones laterales", "Dominadas", "Curl martillo", "Press francés"],
    "Pierna B": ["Prensa de piernas", "Hip thrust", "Curl femoral tumbado", "Zancadas", "Crunch abdominal"],
  }),
  P("full-body", "Cuerpo completo", 3, "Principiante", "Tres días por semana, todo el cuerpo cada vez. La mejor forma de empezar.", {
    "Cuerpo A": ["Sentadilla goblet", "Press de pecho en máquina", "Jalón al pecho", "Press de hombro en máquina", "Plancha"],
    "Cuerpo B": ["Prensa de piernas", "Press con mancuernas", "Remo en máquina", "Curl con mancuernas", "Extensión de tríceps en polea"],
    "Cuerpo C": ["Peso muerto rumano", "Flexiones", "Remo con mancuerna", "Elevaciones laterales", "Crunch abdominal"],
  }),
  P("bro", "Una zona por día", 5, "Intermedio", "Un grupo muscular por día: pecho, espalda, hombros, brazos y piernas.", {
    Pecho: ["Press banca con barra", "Press inclinado con mancuernas", "Aperturas con mancuernas", "Fondos en paralelas"],
    Espalda: ["Dominadas", "Remo con barra", "Jalón al pecho", "Remo con mancuerna"],
    Hombros: ["Press militar con barra", "Elevaciones laterales", "Pájaros (vuelos posteriores)", "Encogimientos de trapecio"],
    Brazos: ["Curl con barra", "Press francés", "Curl martillo", "Extensión de tríceps en polea"],
    Piernas: ["Sentadilla con barra", "Prensa de piernas", "Curl femoral tumbado", "Elevación de gemelos de pie"],
  }),
];

// Garantiza en tiempo de ejecución que cada ejercicio del programa existe en el catálogo.
export const missingPresetExercises = () => PROGRAMS.flatMap((p) => Object.values(p.splits).flat()).filter((n) => !findExercise(n));

/** Explicaciones cortas para quien empieza. Las usan los botones "i" y el asistente. */
export interface Term {
  id: string;
  title: string;
  short: string;
  /** Pasos o ejemplos opcionales. */
  points?: string[];
  /** Palabras con las que el asistente reconoce la pregunta. */
  match: RegExp;
}

export const GYM_TERMS: readonly Term[] = [
  { id: "serie", title: "Serie", short: "Una serie es un bloque seguido de repeticiones, sin parar. Por ejemplo, 10 flexiones seguidas son una serie. Luego descansas y haces la siguiente.", match: /\bseries?\b/ },
  { id: "reps", title: "Repeticiones (reps)", short: "Las veces que haces el movimiento dentro de una serie. Subir y bajar la barra una vez es una repetición.", points: ["Para ganar músculo suele funcionar entre 6 y 12.", "Para fuerza, entre 1 y 5 con más peso."], match: /repeticion|\breps?\b/ },
  { id: "kg", title: "Peso (kg)", short: "El peso que levantas en la serie. Si no sabes cuánto poner, empieza ligero: debes poder hacer todas las repeticiones con buena técnica.", points: ["En máquinas, anota el número de la pila de pesas.", "En mancuernas, anota el peso de UNA mancuerna.", "En ejercicios con tu propio peso (flexiones, dominadas) puedes dejarlo vacío."], match: /\bkg\b|peso (de|que)|cuanto peso/ },
  { id: "rpe", title: "RPE: esfuerzo percibido", short: "Es una nota del 1 al 10 de lo duro que fue la serie. Sirve para saber si estás entrenando suficientemente fuerte sin pasarte.", points: ["10: no podías hacer ni una repetición más.", "9: te sobraba una repetición.", "8: te sobraban dos.", "7: te sobraban tres, era moderado.", "6 o menos: fue fácil."], match: /\brpe\b|esfuerzo percibido/ },
  { id: "rir", title: "RIR: repeticiones en reserva", short: "Cuántas repeticiones te habrían quedado antes de no poder más. RIR 2 significa que podías hacer 2 más.", points: ["RIR 0 = al límite.", "RIR 1-2 = duro pero controlado (la zona ideal para casi todos).", "RIR 4 o más = demasiado fácil."], match: /\brir\b|reserva/ },
  { id: "descanso", title: "Descanso entre series", short: "El tiempo que esperas antes de la siguiente serie para recuperar fuerza.", points: ["Ejercicios pesados (sentadilla, press banca): 2 a 3 minutos.", "Ejercicios de aislamiento (curl, elevaciones): 60 a 90 segundos.", "Si estás empezando, 90 segundos es un buen punto medio."], match: /descanso|descansar entre/ },
  { id: "1rm", title: "1RM estimado", short: "Es el peso máximo que podrías levantar UNA sola vez. No lo probamos de verdad: lo calculamos con tus series (fórmula de Epley). Sirve para comparar tu progreso.", match: /\b1 ?rm\b|repeticion maxima|maximo/ },
  { id: "volumen", title: "Volumen", short: "Es el peso que moviste en total: kg × repeticiones de todas las series. Si sube con el tiempo, estás progresando.", match: /volumen/ },
  { id: "pr", title: "Récord personal (PR)", short: "Tu mejor marca en un ejercicio. Cuando lo superas, Apex lo detecta y suma puntos a tu rango.", match: /\bprs?\b|record/ },
  { id: "fallo", title: "Fallo muscular", short: "El punto en el que ya no puedes hacer otra repetición con buena técnica. No hace falta llegar siempre; con quedarte a 1 o 2 repeticiones del fallo ya es efectivo.", match: /fallo/ },
  { id: "calentamiento", title: "Calentamiento", short: "Series ligeras antes de las pesadas para preparar músculos y articulaciones.", points: ["Haz 5 minutos de cardio suave.", "Luego 1 o 2 series del primer ejercicio con poco peso."], match: /calent/ },
  { id: "hipertrofia", title: "Hipertrofia", short: "Es el término técnico para ganar músculo. Se logra entrenando cerca del límite, de forma constante, comiendo suficiente proteína y durmiendo bien.", match: /hipertrofia|ganar musculo|masa muscular/ },
  { id: "superserie", title: "Superserie", short: "Dos ejercicios seguidos sin descanso entre ellos (por ejemplo, bíceps y tríceps). Ahorra tiempo.", match: /superserie|bi-?serie/ },
  { id: "imc", title: "IMC", short: "El Índice de Masa Corporal relaciona tu peso con tu altura. Es solo una referencia: no distingue músculo de grasa, así que una persona muy musculosa puede salir con IMC alto.", match: /\bimc\b|indice de masa/ },
  { id: "grasa", title: "% de grasa y de músculo", short: "Lo estiman las básculas de bioimpedancia o un profesional. Los números cambian según la hora y la hidratación, así que mira la tendencia de semanas, no el valor de un día.", match: /% ?de grasa|grasa corporal|porcentaje de (grasa|musculo)/ },
  { id: "rangos", title: "Cómo funcionan los rangos", short: "Ganas puntos por entrenar, por cumplir tu meta semanal, por batir récords y por el volumen total. Si pasas una semana entera sin entrenar pierdes 30.", points: ["Cada entreno suma 12 puntos.", "Cada semana que cumples tu meta suma 30.", "Cada récord personal suma 8.", "Hierro → Bronce → Plata → Oro → Platino → Diamante → Magno; cada rango tiene 3 divisiones (1 a 3), menos Magno.", "Cada 7 días seguidos sin entrenar restan 30 puntos y pueden bajarte una división."], match: /rango|nivel|puntos|xp/ },
];

export const findTerm = (id: string) => GYM_TERMS.find((t) => t.id === id);

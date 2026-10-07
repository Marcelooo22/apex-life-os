import { GYM_TERMS } from "../glossary";
import { fetchSongInfo } from "../songinfo";
import { SECTIONS, type SectionId } from "./sections";

interface Faq {
  match: RegExp;
  text: string;
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const FAQ: Record<Exclude<SectionId, "gym">, Faq[]> = {
  habits: [
    { match: /empie|nuevo|comenz|arranc/, text: "Empieza ridículamente pequeño: 2 minutos. Por ejemplo, «leer 1 página» en vez de «leer 30 minutos». Engánchalo a algo que ya haces (después del café, al lavarte los dientes) y ponle un recordatorio a esa hora. Cuando sea automático, súbelo poco a poco." },
    { match: /racha|rompi|fall|perd/, text: "Una racha rota no borra tu progreso. La regla de oro: nunca falles dos veces seguidas. Retómalo hoy con la versión más fácil del hábito; lo importante es volver rápido, no la perfección." },
    { match: /cuantos|demasiad|muchos/, text: "Mejor pocos: 1 a 3 hábitos a la vez. Cuando uno ya sea automático (unas 4 a 8 semanas), añade otro. Muchos hábitos juntos suelen terminar en ninguno." },
    { match: /elegir|cual|que habito|idea/, text: "Elige el que más cambie tu día con menos esfuerzo. Buenas opciones para empezar: tomar agua al despertar, caminar 10 minutos, dormir a la misma hora o estirar 5 minutos. Elige uno y empieza mañana." },
    { match: /recordatorio|aviso|notific/, text: "Pon el recordatorio a la hora en que sueles estar libre, no a la ideal. Recuerda que en Apex los avisos suenan mientras la app está abierta." },
  ],
  nutrition: [
    { match: /proteina/, text: "Como referencia general, entre 1,4 y 2 gramos de proteína por kg de peso al día si entrenas fuerza. Por ejemplo, una persona de 70 kg: unos 100 a 140 g. Repártela en varias comidas. Si tienes una condición médica, consulta con un profesional." },
    { match: /macro/, text: "Los macros son los tres nutrientes que aportan energía: proteína (4 kcal/g, construye y repara), carbohidratos (4 kcal/g, energía) y grasas (9 kcal/g, hormonas y absorción de vitaminas). En Apex ves cuántos has comido de cada uno en la barra superior." },
    { match: /agua|hidrat/, text: "Una referencia común es 30 a 35 ml por kg de peso al día (unos 2 a 2,5 L para 70 kg), más si haces ejercicio o hace calor. Una buena señal es que la orina sea clara." },
    { match: /snack|merienda|picar|antoj/, text: "Ideas de snack: yogur natural con fruta, un puñado de frutos secos, huevo cocido, fruta con crema de maní, queso fresco con tomate o hummus con zanahoria. Busca algo con proteína o fibra para que sacie." },
    { match: /caloria|kcal|energia|deficit|superavit/, text: "Las calorías son la energía de la comida. Para bajar de peso se come un poco menos de lo que gastas (déficit); para ganar músculo, un poco más (superávit). Ajusta tu meta en Apex con el botón de metas y observa la tendencia durante semanas." },
  ],
  hobbies: [
    { match: /\bbpm\b|tempo|pulsaciones/, text: "BPM son los pulsos por minuto: la velocidad de la canción. Para aprender una pieza, empieza a un 60-70 % de su velocidad con metrónomo y súbela de 5 en 5 cuando salga limpia." },
    { match: /tono|tonalidad|clave/, text: "La tonalidad es la escala sobre la que está construida la canción (por ejemplo, Sol Mayor). Conocerla te dice qué notas usar y te ayuda a elegir la hilera o el instrumento adecuado." },
    { match: /gcf|cinco letras|afinaci/, text: "GCF (o «cinco letras») es una afinación de acordeón diatónico de tres hileras muy usada en el vallenato. Las hileras están en Sol, Do y Fa, lo que permite tocar en varias tonalidades sin cambiar de instrumento." },
    { match: /practic|estudi|rutina|plan/, text: "Plan de 20 minutos: 5 de calentamiento (escalas lentas), 10 en el pasaje difícil de la canción a baja velocidad con metrónomo y 5 tocándola completa. Poco y diario rinde más que mucho una vez por semana." },
    { match: /metronomo/, text: "El metrónomo marca el pulso. Úsalo siempre al aprender: empieza lento, sube el BPM poco a poco y apunta en Apex el BPM actual y el objetivo." },
  ],
  uni: [
    { match: /pomodoro/, text: "El Pomodoro divide el estudio en bloques de 25 minutos de enfoque total y 5 de descanso; tras 4 bloques, descanso largo de 15. Está en la columna derecha de Universidad, y sigue corriendo aunque cambies de pantalla." },
    { match: /promedio|nota|ponder/, text: "Tu promedio es ponderado: cada evaluación pesa según el porcentaje que indicaste. Si no pones pesos, todas valen lo mismo. Apex calcula el promedio de cada asignatura y el general." },
    { match: /parcial|examen|estudio|plan/, text: "Plan para un parcial: 1) lista los temas y marca los que menos dominas; 2) reparte los días que faltan, empezando por los difíciles; 3) haz un bloque diario de repaso activo (preguntas y ejercicios, no solo releer); 4) la víspera, repaso ligero y a dormir." },
    { match: /trabajo|entrega|dividir|pasos|ensayo/, text: "Divide el trabajo en pasos de 30-60 minutos: entender el enunciado, esquema, investigación, primer borrador, revisión y formato. Ponle una fecha a cada paso y crea esas mini-entregas en Apex para que aparezcan en tu agenda." },
  ],
};

/** Respuesta a preguntas de música: busca la canción y luego su BPM y tono. */
async function songAnswer(text: string): Promise<string | null> {
  const t = fold(text);
  if (!/\b(bpm|tempo|tono|tonalidad|clave)\b/.test(t)) return null;
  const m = /\b(?:de|del|para|of)\s+(.{2,80})$/i.exec(text.replace(/[¿?!¡]/g, "").trim());
  const query = (m?.[1] ?? "").trim();
  if (query.length < 2) return "Dime de qué canción, por ejemplo: «BPM de Obsesión de Aventura».";
  try {
    const res = await fetch(`/api/music?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(9000) });
    const track = ((await res.json()) as { results?: { id: string; title: string; artist: string; source: string }[] }).results?.[0];
    if (!track) return `No encontré «${query}». Prueba con el título y el artista.`;
    const info = await fetchSongInfo(track);
    if (!info || (!info.bpm && !info.key)) return `Encontré «${track.title}» de ${track.artist}, pero no tengo su BPM ni su tono. Puedes buscarlo en GetSongBPM o medirlo con un metrónomo.`;
    const parts = [info.bpm ? `${info.bpm} BPM` : null, info.key ? `tono ${info.key}` : null].filter(Boolean).join(", ");
    return `«${track.title}» de ${track.artist}: ${parts}.${info.approx ? " Es una estimación de la IA, compruébalo con la canción." : ` (Fuente: ${info.from.bpm ?? info.from.key}.)`}`;
  } catch {
    return "No pude consultar el catálogo ahora mismo. Inténtalo de nuevo en un momento.";
  }
}

/** Respuesta sin IA: glosario por sección y búsqueda de BPM/tono. */
export async function answerLocal(scope: SectionId, text: string): Promise<string> {
  const t = fold(text);
  if (scope === "hobbies") {
    const song = await songAnswer(text);
    if (song) return song;
  }
  if (scope === "gym") {
    const term = GYM_TERMS.find((x) => x.match.test(t));
    if (term) return [term.short, ...(term.points ?? []).map((p) => `- ${p}`)].join("\n");
    if (/rutina|programa|dias|semana|principiante|empezar/.test(t)) return "Si empiezas, prueba «Cuerpo completo» 3 días a la semana (lunes, miércoles y viernes): sentadilla, empuje, tirón y core. En la pestaña Hoy pulsa «Elegir programa» y lo añade con los ejercicios ya puestos.";
  } else {
    const hit = FAQ[scope].find((f) => f.match.test(t));
    if (hit) return hit.text;
  }
  const cfg = SECTIONS[scope];
  return `Esa pregunta no la tengo guardada. Con la IA activada puedo responder cualquier cosa sobre ${cfg.topic}. Mientras tanto, prueba con las sugerencias de abajo.`;
}

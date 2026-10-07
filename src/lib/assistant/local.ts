import { ALL_DAYS, CUSTOM_COLORS } from "../constants";
import { clean, defaultQuick, type ModuleSpec } from "../custom";
import { muscleOf } from "../gym";
import type { HabitCategory, Slot } from "../types";
import type { HabitSpec, Proposal } from "./schema";

/**
 * Intérprete local: entiende peticiones sencillas en español sin conectarse a ningún servicio.
 * Es la red de seguridad cuando no hay clave de IA configurada (o falla la conexión).
 */
export interface Pending {
  kind: "routine";
  name: string;
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const upperFirst = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Primeras palabras de un título, sin dejar conectores colgando ("pendientes de la" → "pendientes"). */
function shortTitle(text: string, maxWords: number): string {
  const words = text.replace(/[,.;:!?]+/g, " ").trim().split(/\s+/).slice(0, maxWords);
  while (words.length > 1 && /^(?:de|del|la|el|los|las|un|una|y|a|en|con|para|por|mis|mi)$/i.test(words[words.length - 1] ?? "")) words.pop();
  return words.join(" ");
}

export const ASSISTANT_EXAMPLES = [
  "Un panel para seguir mis finanzas",
  "Quiero meditar 10 minutos todos los días a las 7 am",
  "Rutina de brazos: curl con barra, martillo, fondos",
  "Un contador de páginas leídas, meta 20 al día",
] as const;

const reply = (text: string, pending?: Pending): Proposal => ({ kind: "reply", reply: text, ...(pending ? { pending } : {}) });

/* ===================== Días y horas ===================== */
const DAY_NAMES = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

function parseDays(t: string): number[] {
  const range = new RegExp(`de (${DAY_NAMES.join("|")})s? a (${DAY_NAMES.join("|")})s?`).exec(t);
  if (range) {
    const a = DAY_NAMES.indexOf(range[1]!);
    const b = DAY_NAMES.indexOf(range[2]!);
    if (a >= 0 && b >= a) return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  if (/entre semana|dias laborales|dias habiles|laborables/.test(t)) return [0, 1, 2, 3, 4];
  if (/fines? de semana|findes?/.test(t)) return [5, 6];
  if (/todos los dias|cada dia|a diario|diariamente|\bdiario\b/.test(t)) return [...ALL_DAYS];
  const found = DAY_NAMES.map((n, i) => (new RegExp(`\\b${n}s?\\b`).test(t) ? i : -1)).filter((i) => i >= 0);
  return found.length ? found : [...ALL_DAYS];
}

function parseTime(t: string): string {
  const match =
    /(?:a las?|a la|sobre las?|hacia las?)\s*(\d{1,2})(?:[:.h](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/.exec(t) ??
    /\b(\d{1,2}):(\d{2})\s*(am|pm)?/.exec(t) ??
    /\b(\d{1,2})()\s*(am|pm)\b/.exec(t);
  if (!match) return "";
  let hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const suffix = match[3] ?? "";
  if (hour > 23 || minutes > 59) return "";
  if (suffix.startsWith("p") && hour < 12) hour += 12;
  else if (suffix.startsWith("a") && hour === 12) hour = 0;
  else if (!suffix) {
    if (/noche/.test(t) && hour >= 5 && hour <= 11) hour += 12;
    else if (/tarde/.test(t) && hour >= 1 && hour <= 7) hour += 12;
  }
  return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function slotOf(t: string, time: string): Slot {
  if (time) {
    const h = Number(time.slice(0, 2));
    return h < 12 ? "morning" : h < 19 ? "afternoon" : "night";
  }
  if (/noche|dormir|acostar/.test(t)) return "night";
  if (/tarde/.test(t)) return "afternoon";
  return "morning";
}

/* ===================== Categorías de hábito ===================== */
const CATEGORY_WORDS: readonly (readonly [HabitCategory, RegExp])[] = [
  ["body", /entren|gym|gimnasio|correr|caminar|ejercicio|yoga|estirar|nadar|bici|pesas|flexiones|abdominales|pasos/],
  ["mind", /meditar|medit|respir|gratitud|mindful|terapia|descansar de|pantalla|rezar|orar|journal/],
  ["learning", /leer|lectura|estudiar|idioma|ingles|aprender|curso|practicar|acordeon|guitarra|saxofon|podcast/],
  ["money", /ahorr|gastos|finanzas|presupuesto|invert|dinero/],
  ["social", /llamar|familia|amigos|pareja|social|escribir a/],
  ["home", /limpiar|ordenar|cocinar|lavar|tender la cama|plantas|casa|basura/],
  ["work", /trabajo|proyecto|correos|emails|planificar|revisar|productiv|escribir/],
  ["health", /agua|dormir|sueno|vitamina|medicina|dientes|skincare|piel|fruta|dieta|ayuno|alcohol|fumar/],
];

const categoryOf = (t: string): HabitCategory => CATEGORY_WORDS.find(([, re]) => re.test(t))?.[0] ?? "health";

/* ===================== Hábito ===================== */
const LEADING = /^(?:hola[,!. ]*|quiero|quisiera|necesito|me gustar[ií]a|vamos a|puedes|podr[ií]as|por favor|porfa|crea(?:r|me)?|a[ñn]ade|agrega|nuevo|nueva|un|una|el|la|h[aá]bito|rutina|de|para|que|empezar a|comenzar a|empieza a|tener|hacer)\s+/i;

function habitName(text: string): string {
  let name = text.replace(/\s+/g, " ").trim();
  for (let i = 0; i < 8; i++) {
    const next = name.replace(LEADING, "");
    if (next === name) break;
    name = next;
  }
  name = name
    .replace(/\b(?:todos los d[ií]as|cada d[ií]a|a diario|diariamente|al d[ií]a|entre semana|fines? de semana)\b/gi, "")
    .replace(/\bde (?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)s? a (?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)s?\b/gi, "")
    .replace(/\b(?:los|cada)\s+(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)(?:\s*(?:,|y)\s*(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?))*/gi, "")
    .replace(/\b(?:a las?|a la|sobre las?)\s*\d{1,2}(?:[:.h]\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.|de la (?:ma[ñn]ana|tarde|noche))?/gi, "")
    .replace(/\b\d{1,2}:\d{2}\s*(?:am|pm)?/gi, "")
    .replace(/\b(?:por la|en la|de la)\s+(?:ma[ñn]ana|tarde|noche)\b/gi, "")
    .replace(/\b(?:de|por|y)\s*$/i, "")
    .replace(/[,.;:!?]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return upperFirst(clean(name, 40)) || "Nuevo hábito";
}

function interpretHabit(text: string, t: string): Proposal {
  const time = parseTime(t);
  const days = parseDays(t);
  const habit: HabitSpec = { name: habitName(text), category: categoryOf(t), days, reminder: time, slot: slotOf(t, time) };
  const when = days.length === 7 ? "todos los días" : "los días que indicaste";
  return {
    kind: "habit",
    habit,
    reply: `Te propongo el hábito «${habit.name}», ${when}${time ? `, con recordatorio a las ${time}` : ""}. Puedes ajustarlo después.`,
  };
}

/* ===================== Rutina de gym ===================== */
const LIST_SPLIT = /\s*(?:,|;|\n|\s+y\s+|\s+e\s+)\s*/i;

function exerciseList(raw: string): string[] {
  return [...new Set(raw.split(LIST_SPLIT).map((s) => upperFirst(clean(s.replace(/^(?:y|e)\s+/i, ""), 40))).filter((s) => s.length > 1))].slice(0, 12);
}

function interpretRoutine(text: string): Proposal {
  const match = /rutina\s+(?:de|para)?\s*([^:,.]+?)\s*(?::|\s+con\s+|\s+que\s+(?:incluya|tenga|lleve)\s+|\s+incluyendo\s+|\s+incluye\s+)\s*(.+)$/i.exec(text);
  if (match?.[1] && match[2]) {
    const exercises = exerciseList(match[2]);
    const name = upperFirst(clean(match[1], 24));
    if (exercises.length) {
      return { kind: "routine", routine: { name, exercises }, reply: `Te propongo la rutina «${name}» con ${exercises.length} ejercicios.` };
    }
  }
  const bare = /rutina\s+(?:de|para)\s+([^:,.]+)/i.exec(text);
  const name = upperFirst(clean(bare?.[1] ?? "Mi rutina", 24));
  return reply(`¿Qué ejercicios incluye la rutina «${name}»? Escríbelos separados por comas.`, { kind: "routine", name });
}

/* ===================== Módulo personalizado ===================== */
interface Theme {
  re: RegExp;
  template: ModuleSpec["template"];
  icon: string;
  color: string;
  topic: string;
  unit?: string;
  goal?: number;
  description: string;
}

const hex = (id: (typeof CUSTOM_COLORS)[number]["id"]) => CUSTOM_COLORS.find((c) => c.id === id)!.hex;

const THEMES: readonly Theme[] = [
  { re: /finanza|dinero|gasto|ingreso|presupuesto|ahorro|plata|cuentas|inversi|econom/, template: "ledger", icon: "wallet", color: hex("teal"), topic: "Finanzas", description: "Registra ingresos y gastos y mira tu balance del mes." },
  { re: /diario|journal|bitacora|gratitud|reflexi|ideas|pensamientos/, template: "journal", icon: "pencil", color: hex("sand"), topic: "Diario", description: "Escribe una entrada al día y sigue cómo te sientes." },
  { re: /agua|hidrat|vasos/, template: "counter", icon: "drop", color: hex("sky"), topic: "Agua", unit: "vasos", goal: 8, description: "Cuenta tus vasos de agua del día." },
  { re: /pasos|caminat|caminar/, template: "counter", icon: "bolt", color: hex("lime"), topic: "Pasos", unit: "pasos", goal: 8000, description: "Suma tus pasos diarios hacia la meta." },
  { re: /leer|lectura|libros|paginas|lecturas/, template: "counter", icon: "book", color: hex("indigo"), topic: "Lectura", unit: "páginas", goal: 20, description: "Cuenta las páginas que lees cada día." },
  { re: /contador|contar|cantidad|veces|horas de|minutos de/, template: "counter", icon: "target", color: hex("gold"), topic: "Contador", unit: "veces", goal: 5, description: "Suma cada día hasta llegar a tu meta." },
  { re: /viaje|vacaciones|compras|supermercado|mercado|tareas|pendientes|checklist|lista|proyecto|casa|mudanza|evento|boda/, template: "checklist", icon: "cart", color: hex("rose"), topic: "Pendientes", description: "Una lista para ir tachando lo que falta." },
];

const UNIT_RE = /(\d+(?:[.,]\d+)?)\s*(paginas?|pags?|vasos?|litros?|ml|km|kilometros?|minutos?|min|horas?|pasos|repeticiones|reps|kg|veces|capitulos?|palabras|flexiones|calorias|kcal)\b/;
const UNIT_LABEL: Record<string, string> = {
  pagina: "páginas", paginas: "páginas", pag: "páginas", pags: "páginas", vaso: "vasos", vasos: "vasos", litro: "litros", litros: "litros",
  ml: "ml", km: "km", kilometro: "km", kilometros: "km", minuto: "min", minutos: "min", min: "min", hora: "horas", horas: "horas",
  pasos: "pasos", repeticiones: "reps", reps: "reps", kg: "kg", veces: "veces", capitulo: "capítulos", capitulos: "capítulos",
  palabras: "palabras", flexiones: "flexiones", calorias: "kcal", kcal: "kcal",
};

function currencyOf(t: string): string {
  if (/€|euros?|\beur\b/.test(t)) return "€";
  if (/dolares|usd|us\$/.test(t)) return "US$";
  return "$";
}

/** Intenta sacar de qué trata el panel ("mis finanzas", "lectura diaria"…). */
function topicOf(text: string): string {
  const patterns = [
    /(?:panel|m[oó]dulo|secci[oó]n|tracker|seguimiento|registro|lista|diario|bit[aá]cora|contador)\s+(?:de|para)\s+(?:seguir|llevar|controlar|registrar|gestionar|organizar|monitorear)?\s*(?:mis|mi|el|la|los|las|un|una)?\s*([^,.;:!?]+)/i,
    /(?:seguir|llevar|controlar|registrar|gestionar|organizar|monitorear)\s+(?:mis|mi|el|la|los|las)?\s*([^,.;:!?]+)/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m?.[1]) {
      const cut = m[1].split(/\s+(?:con|que|donde|para|en el|en la|y que|usando)(?=[\s:,]|$)/i)[0] ?? "";
      const words = shortTitle(cut, 4);
      if (words.length > 1) return upperFirst(clean(words, 28));
    }
  }
  return "";
}

/** "Viaje a Madrid con: pasaportes, maletas" → "Viaje a Madrid". */
function titleBeforeList(text: string): string {
  const head = (text.split(/\s*:\s*|\s+(?:con|incluye|incluyendo)\s+/i)[0] ?? "").replace(/\s+(?:con|incluye|incluyendo)$/i, "");
  let name = head.trim();
  for (let i = 0; i < 6; i++) {
    const next = name.replace(LEADING, "");
    if (next === name) break;
    name = next;
  }
  const words = shortTitle(name, 4);
  return words.length > 1 ? upperFirst(clean(words, 28)) : "";
}

function interpretModule(text: string, t: string): Proposal {
  const theme = THEMES.find((th) => th.re.test(t));
  const hasList = /(?:con|incluye|incluyendo|:)\s+\S+.*[,y]/i.test(text);
  const topic = topicOf(text) || (hasList && theme?.template === "checklist" ? titleBeforeList(text) : "") || theme?.topic || "Mi panel";
  const unitMatch = UNIT_RE.exec(t);
  const template = unitMatch ? "counter" : (theme?.template ?? "checklist");
  const base = theme && theme.template === template ? theme : undefined;

  const goal = unitMatch ? Math.max(1, Math.round(parseFloat(unitMatch[1]!.replace(",", ".")))) : (base?.goal ?? 10);
  const unit = unitMatch ? (UNIT_LABEL[unitMatch[2]!] ?? unitMatch[2]!) : (base?.unit ?? "");
  const listMatch = /(?:con|incluye|incluyendo|:)\s+(.+)$/i.exec(text);
  const items = template === "checklist" && listMatch?.[1] ? exerciseList(listMatch[1]) : [];

  const spec: ModuleSpec = {
    name: clean(topic, 28),
    icon: base?.icon ?? theme?.icon ?? "star",
    color: base?.color ?? theme?.color ?? hex("indigo"),
    template,
    description: base?.description ?? (template === "counter" ? "Suma cada día hasta llegar a tu meta." : "Un panel hecho a tu medida."),
    unit,
    goal,
    currency: currencyOf(t),
    items,
    quick: defaultQuick(goal),
  };
  const kindText = { checklist: "una lista de tareas", counter: "un contador diario", ledger: "un registro de movimientos", journal: "un diario" }[template];
  return { kind: "module", spec, reply: `Te propongo el panel «${spec.name}»: ${kindText}. Puedes cambiar el nombre después.` };
}

/* ===================== Punto de entrada ===================== */
const HABIT_HINT = /todos los dias|cada dia|a diario|diariamente|entre semana|fines? de semana|\ba las\s*\d|\bhabito\b|\bcada (?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)|\blos (?:lunes|martes|miercoles|jueves|viernes|sabados|domingos)/;
const MODULE_HINT = /\b(?:panel|modulo|seccion|tracker|seguimiento|registro|lista|diario|bitacora|contador|llevar|controlar|gestionar|organizar|monitorear|seguir)\b/;
const GYM_HINT = /gym|gimnasio|entren|ejercicio|pecho|espalda|pierna|brazo|hombro|biceps|triceps|abdomen|gluteo|cardio|fuerza/;

export function interpretLocal(input: string, pending?: Pending): Proposal {
  const text = clean(input, 400);
  const t = fold(text);
  if (t.length < 3) return reply("Cuéntame qué quieres crear: un hábito, una rutina de gym o un panel nuevo.");

  // Respuesta a «¿qué ejercicios incluye?»
  if (pending?.kind === "routine") {
    const exercises = exerciseList(text);
    if (exercises.length) {
      return { kind: "routine", routine: { name: pending.name, exercises }, reply: `Listo: la rutina «${pending.name}» con ${exercises.length} ejercicios.` };
    }
  }

  const exerciseHits = exerciseList(text).filter((e) => muscleOf(e) !== null).length;
  if (/\brutina\b|\bdivision\b/.test(t) && (GYM_HINT.test(t) || exerciseHits >= 2)) return interpretRoutine(text);
  if (/\bhabito\b/.test(t)) return interpretHabit(text, t);
  if (MODULE_HINT.test(t) || THEMES.some((th) => th.re.test(t))) {
    // «Quiero meditar todos los días» sin palabra de panel es un hábito, aunque haya coincidencia temática.
    if (HABIT_HINT.test(t) && !/\b(?:panel|modulo|seccion|tracker|seguimiento|registro|lista|bitacora|contador)\b/.test(t)) return interpretHabit(text, t);
    return interpretModule(text, t);
  }
  if (HABIT_HINT.test(t)) return interpretHabit(text, t);
  if (exerciseHits >= 2) return interpretRoutine(`rutina de entreno: ${text}`);
  if (t.split(/\s+/).length >= 3 && /quiero|necesito|crear|crea|anade|agrega/.test(t)) return interpretModule(text, t);
  return reply("Puedo crear un hábito, una rutina de gym o un panel nuevo. Prueba, por ejemplo: «un panel para seguir mis finanzas».");
}


import { CUSTOM_COLORS, CUSTOM_ICONS } from "./constants";
import { dkey } from "./dates";
import type { CustomEntry, CustomItem, CustomModule, CustomTemplate, CustomViewId } from "./types";
import { uid } from "./utils";

/** Lo que el asistente propone para crear un módulo (antes de convertirlo en datos reales). */
export interface ModuleSpec {
  name: string;
  icon: string;
  color: string;
  template: CustomTemplate;
  description: string;
  unit: string;
  goal: number;
  currency: string;
  items: string[];
  quick: number[];
}

export const TEMPLATES: readonly CustomTemplate[] = ["checklist", "counter", "ledger", "journal"];

export const TEMPLATE_LABEL: Record<CustomTemplate, string> = {
  checklist: "Lista de tareas",
  counter: "Contador diario",
  ledger: "Registro de movimientos",
  journal: "Diario",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_RE = /^#[0-9a-f]{6}$/i;

/** Texto corto y seguro: sin caracteres de control, recortado. */
export function clean(value: unknown, max: number): string {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

const finite = (value: unknown, fallback: number, min: number, max: number) => {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export const isCustomIcon = (name: unknown): name is (typeof CUSTOM_ICONS)[number] =>
  typeof name === "string" && (CUSTOM_ICONS as readonly string[]).includes(name);

/** Acepta un id de la paleta ("teal") o un hex ya válido; si no, el color por defecto. */
export function normalizeColor(value: unknown, fallback: string = CUSTOM_COLORS[4].hex): string {
  const raw = String(value ?? "").trim().toLowerCase();
  const byId = CUSTOM_COLORS.find((c) => c.id === raw);
  if (byId) return byId.hex;
  const byHex = CUSTOM_COLORS.find((c) => c.hex === raw);
  if (byHex) return byHex.hex;
  return HEX_RE.test(fallback) ? fallback : CUSTOM_COLORS[4].hex;
}

export const hexToRgb = (hex: string): string => {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return m ? `${parseInt(m[1]!, 16)},${parseInt(m[2]!, 16)},${parseInt(m[3]!, 16)}` : "56,189,248";
};

const NICE_STEPS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
const nearest = (target: number) => NICE_STEPS.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));

/** Cantidades rápidas razonables según la meta diaria. */
export function defaultQuick(goal: number): number[] {
  return [...new Set([nearest(goal / 30), nearest(goal / 10), nearest(goal / 4)])].sort((a, b) => a - b);
}

/** Valida lo que devuelve la IA o el intérprete local. Devuelve null si no sirve. */
export function sanitizeSpec(raw: unknown): ModuleSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const template = TEMPLATES.find((t) => t === r.template);
  const name = clean(r.name, 28);
  if (!template || !name) return null;
  const goal = Math.round(finite(r.goal, 10, 1, 1_000_000));
  const quick = Array.isArray(r.quick)
    ? [...new Set(r.quick.map((q) => Math.round(finite(q, 0, 0, 1_000_000))).filter((q) => q > 0))].slice(0, 4)
    : [];
  return {
    name,
    icon: isCustomIcon(r.icon) ? r.icon : "star",
    color: normalizeColor(r.color),
    template,
    description: clean(r.description, 120),
    unit: clean(r.unit, 14),
    goal,
    currency: clean(r.currency, 4) || "$",
    items: Array.isArray(r.items) ? r.items.map((i) => clean(i, 80)).filter(Boolean).slice(0, 12) : [],
    quick: quick.length ? quick.sort((a, b) => a - b) : defaultQuick(goal),
  };
}

/** Crea el módulo real (con id y datos vacíos) a partir de una propuesta válida. */
export function buildModule(spec: ModuleSpec): CustomModule {
  const id = `c-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`.toLowerCase() as CustomViewId;
  return {
    id,
    name: spec.name,
    icon: spec.icon,
    color: spec.color,
    template: spec.template,
    description: spec.description,
    unit: spec.unit,
    goal: spec.goal,
    currency: spec.currency,
    created: dkey(),
    items: spec.template === "checklist" ? spec.items.map((text) => ({ id: uid(), text, done: false })) : [],
    log: {},
    entries: [],
    quick: spec.quick,
  };
}

/** Valida un módulo guardado (por ejemplo, al importar una copia de seguridad). */
export function sanitizeCustomModule(raw: unknown): CustomModule | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const spec = sanitizeSpec(r);
  const id = typeof r.id === "string" && /^c-[a-z0-9]{3,24}$/.test(r.id) ? (r.id as CustomViewId) : null;
  if (!spec || !id) return null;

  const items: CustomItem[] = Array.isArray(r.items)
    ? r.items
        .map((i): CustomItem | null => {
          if (!i || typeof i !== "object") return null;
          const o = i as Record<string, unknown>;
          const text = clean(o.text, 120);
          return text ? { id: clean(o.id, 24) || uid(), text, done: o.done === true } : null;
        })
        .filter((i): i is CustomItem => i !== null)
        .slice(0, 300)
    : [];

  const entries: CustomEntry[] = Array.isArray(r.entries)
    ? r.entries
        .map((e): CustomEntry | null => {
          if (!e || typeof e !== "object") return null;
          const o = e as Record<string, unknown>;
          const date = typeof o.date === "string" && DATE_RE.test(o.date) ? o.date : null;
          if (!date) return null;
          const entry: CustomEntry = { id: clean(o.id, 24) || uid(), date, text: clean(o.text, 600) };
          if (o.amount !== undefined) entry.amount = finite(o.amount, 0, -1e12, 1e12);
          if (o.tag) entry.tag = clean(o.tag, 20);
          if (o.mood !== undefined) entry.mood = Math.round(finite(o.mood, 3, 1, 5));
          return entry;
        })
        .filter((e): e is CustomEntry => e !== null)
        .slice(-5000)
    : [];

  const log: Record<string, number> = {};
  if (r.log && typeof r.log === "object") {
    for (const [k, v] of Object.entries(r.log as Record<string, unknown>)) {
      if (DATE_RE.test(k)) log[k] = finite(v, 0, 0, 1e9);
    }
  }

  return {
    id,
    name: spec.name,
    icon: spec.icon,
    color: spec.color,
    template: spec.template,
    description: spec.description,
    unit: spec.unit,
    goal: spec.goal,
    currency: spec.currency,
    created: typeof r.created === "string" && DATE_RE.test(r.created) ? r.created : dkey(),
    items,
    log,
    entries,
    quick: spec.quick,
  };
}

/* ===================== Cálculos de cada plantilla ===================== */
export const todayAmount = (m: CustomModule, key: string) => m.log[key] ?? 0;

/** Racha de días seguidos en que se alcanzó la meta del contador. */
export function counterStreak(m: CustomModule, today: string): number {
  let n = 0;
  const d = new Date(today + "T00:00:00");
  if ((m.log[today] ?? 0) < m.goal) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 1000; i++) {
    if ((m.log[dkey(d)] ?? 0) < m.goal) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const ledgerBalance = (m: CustomModule) => m.entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);

/** Resumen para la burbuja del inicio. */
export function customMetric(m: CustomModule, today: string): { p: number; t: string } {
  switch (m.template) {
    case "checklist": {
      const total = m.items.length;
      const done = m.items.filter((i) => i.done).length;
      return { p: total ? done / total : 0, t: total ? `${done} de ${total}` : "Añade la primera" };
    }
    case "counter": {
      const value = todayAmount(m, today);
      return { p: value / m.goal, t: `${Math.round(value * 10) / 10} / ${m.goal}${m.unit ? " " + m.unit : ""}` };
    }
    case "ledger": {
      const month = today.slice(0, 7);
      const net = m.entries.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + (e.amount ?? 0), 0);
      return { p: m.entries.length ? 1 : 0, t: m.entries.length ? `${net >= 0 ? "+" : "−"}${m.currency}${Math.abs(Math.round(net)).toLocaleString("es-CO")} este mes` : "Sin movimientos" };
    }
    case "journal": {
      const week = m.entries.filter((e) => e.date >= weekAgo(today)).length;
      return { p: Math.min(1, week / 7), t: week ? `${week} esta semana` : "Escribe la primera" };
    }
  }
}

function weekAgo(today: string): string {
  const d = new Date(today + "T00:00:00");
  d.setDate(d.getDate() - 6);
  return dkey(d);
}

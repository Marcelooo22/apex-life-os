/** Une clases CSS ignorando valores falsos. */
export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

/** Convierte texto de un input ("12,5") en número; devuelve 0 si no es válido. */
export const num = (value: unknown): number => {
  const n = parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const fmt = (n: number) => Math.round(n).toLocaleString("es-CO");
export const pad = (n: number) => String(n).padStart(2, "0");
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

export const haptic = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* sin vibración disponible */
  }
};

/** Normaliza un enlace y solo permite http(s). Devuelve "" si no es válido. */
export const safeUrl = (input: unknown): string => {
  let u = String(input ?? "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const url = new URL(u);
    return /^https?:$/.test(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

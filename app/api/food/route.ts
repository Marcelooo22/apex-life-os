import { NextResponse, type NextRequest } from "next/server";
import { CACHE_HEADERS, rateLimited, TtlCache } from "@/lib/server/http";
import type { FoodHit } from "@/lib/food";

/**
 * Buscador de alimentos sobre Open Food Facts (gratis, sin clave). Se consulta desde el servidor porque
 * no permite llamadas directas desde el navegador, y se filtran los productos con datos incompletos o
 * absurdos (la base es colaborativa y a veces trae errores).
 */
const cache = new TtlCache<FoodHit[]>(10 * 60_000);

const UA = "ApexLifeOS/1.0 (app personal; https://github.com/)";
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "con", "y", "en", "a", "al", "un", "una", "sin", "por", "para", "and", "or", "not", "to"]);
const ENERGY = "(nutriments.energy-kcal_100g:[1 TO *] OR nutriments.energy-kj_100g:[1 TO *])";

interface OffHit {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const number = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Texto del usuario → palabras seguras para la sintaxis de búsqueda (solo letras y números). */
function tokenize(q: string): string[] {
  return q
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t))
    .slice(0, 5);
}

/** Una condición AND por palabra; la última, como prefijo, para que "pech" ya encuentre "pechuga". */
function buildQuery(tokens: string[], spanishOnly: boolean): string {
  const terms = tokens.map((t, i) => (i === tokens.length - 1 && t.length >= 3 ? `${t}*` : t));
  return [...terms, ...(spanishOnly ? ["lang:es"] : []), ENERGY].join(" AND ");
}

function toFood(hit: OffHit): FoodHit | null {
  const name = (hit.product_name ?? "").replace(/\s+/g, " ").trim();
  const n = hit.nutriments ?? {};
  if (!name || !hit.code) return null;

  const kj = number(n["energy-kj_100g"]);
  const kcal = number(n["energy-kcal_100g"]) ?? (kj !== null ? kj / 4.184 : null);
  const p = number(n["proteins_100g"]);
  const c = number(n["carbohydrates_100g"]);
  const f = number(n["fat_100g"]);
  if (kcal === null || kcal < 1 || kcal > 900) return null;
  if (p === null && c === null && f === null) return null;
  const [P, C, F] = [p ?? 0, c ?? 0, f ?? 0];
  if (P < 0 || C < 0 || F < 0 || P + C + F > 105) return null;
  // Las calorías deben ser coherentes con los macros (4-4-9); se tolera alcohol y fibra.
  const expected = 4 * P + 4 * C + 9 * F;
  if (kcal > expected * 1.8 + 50 || kcal < expected * 0.55 - 10) return null;

  const brand = Array.isArray(hit.brands) ? (hit.brands[0] ?? "") : (hit.brands ?? "").split(",")[0] ?? "";
  const sv = /(\d+(?:[.,]\d+)?)\s*(g|ml)\b/i.exec(hit.serving_size ?? "");
  const grams = sv ? parseFloat(sv[1]!.replace(",", ".")) : 0;

  return {
    id: hit.code,
    name: name.slice(0, 90),
    brand: brand.trim().slice(0, 40),
    per100: { kcal: Math.round(kcal), p: round1(P), c: round1(C), f: round1(F) },
    serving: grams >= 5 && grams <= 1000 ? { grams: Math.round(grams), label: `${Math.round(grams)} ${sv![2]!.toLowerCase()}` } : null,
  };
}

async function query(tokens: string[], spanishOnly: boolean): Promise<OffHit[]> {
  const params = new URLSearchParams({
    q: buildQuery(tokens, spanishOnly),
    langs: "es,en",
    page_size: "30",
    fields: "code,product_name,brands,nutriments,serving_size",
  });
  const res = await fetch(`https://search.openfoodfacts.org/search?${params}`, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  const data = (await res.json()) as { hits?: OffHit[] };
  return data.hits ?? [];
}

export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  const tokens = tokenize(q);
  if (!tokens.length || tokens.join("").length < 2) return NextResponse.json({ results: [] });
  if (rateLimited(request, "food", 30)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const key = tokens.join(" ");
  const cached = cache.get(key);
  if (cached) return NextResponse.json({ results: cached }, { headers: CACHE_HEADERS });

  try {
    let hits = await query(tokens, true);
    if (!hits.length) hits = await query(tokens, false);

    const seen = new Set<string>();
    const foods = hits
      .map(toFood)
      .filter((f): f is FoodHit => f !== null)
      .filter((f) => {
        const id = `${fold(f.name)}|${fold(f.brand)}|${f.per100.kcal}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    // Los nombres cortos y que contienen todas las palabras suelen ser el alimento "genérico".
    const score = (f: FoodHit) => {
      const name = fold(f.name);
      const covered = tokens.filter((t) => name.includes(fold(t))).length;
      return covered * 100 - name.length;
    };
    const results = foods.sort((a, b) => score(b) - score(a)).slice(0, 10);

    cache.set(key, results);
    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}

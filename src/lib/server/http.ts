import type { NextRequest } from "next/server";

/**
 * Límite de peticiones por IP en memoria. En un servidor sin estado compartido es una protección básica
 * (frena abusos obvios y bucles), no un sistema de cuotas exacto.
 */
const hits = new Map<string, number[]>();

export function rateLimited(request: NextRequest, scope: string, limit: number, windowMs = 60_000): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "anon";
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  // Evita que el mapa crezca sin límite en servidores de larga vida.
  if (hits.size > 2000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return recent.length > limit;
}

/** Caché pequeña con caducidad para no repetir consultas idénticas a servicios externos. */
export class TtlCache<T> {
  private store = new Map<string, { at: number; value: T }>();
  constructor(
    private ttlMs: number,
    private max = 300,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() - hit.at > this.ttlMs) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: string, value: T) {
    if (this.store.size >= this.max) this.store.delete(this.store.keys().next().value as string);
    this.store.set(key, { at: Date.now(), value });
  }
}

export const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } as const;

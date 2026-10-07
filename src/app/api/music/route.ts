import { NextResponse, type NextRequest } from "next/server";
import { CACHE_HEADERS, rateLimited, TtlCache } from "@/lib/server/http";
import type { TrackHit } from "@/lib/music";

/**
 * Buscador musical: pregunta a Deezer (no necesita clave) desde el servidor, porque Deezer no permite
 * llamadas directas desde el navegador, y devuelve solo los datos que usa la app.
 */
const cache = new TtlCache<TrackHit[]>(10 * 60_000);

interface DeezerTrack {
  id?: number;
  title?: string;
  duration?: number;
  link?: string;
  artist?: { name?: string };
  album?: { title?: string; cover_big?: string; cover_medium?: string };
}

/** Solo se aceptan carátulas servidas por el CDN de Deezer (se guardan y se pintan como imagen). */
const safeCover = (url: string | undefined) => {
  try {
    const u = new URL(url ?? "");
    return u.protocol === "https:" && /(^|\.)dzcdn\.net$/.test(u.hostname) ? u.href : "";
  } catch {
    return "";
  }
};

const safeLink = (url: string | undefined) => (url?.startsWith("https://www.deezer.com/") ? url : "");

export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  if (rateLimited(request, "music", 40)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached) return NextResponse.json({ results: cached }, { headers: CACHE_HEADERS });

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=12`, {
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const data = (await res.json()) as { data?: DeezerTrack[]; error?: unknown };
    if (data.error) return NextResponse.json({ error: "upstream" }, { status: 502 });

    const seen = new Set<string>();
    const results: TrackHit[] = [];
    for (const t of data.data ?? []) {
      if (!t.id || !t.title || !t.artist?.name) continue;
      const dedupe = `${t.title}|${t.artist.name}|${t.album?.title ?? ""}`.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      results.push({
        id: String(t.id),
        title: t.title.slice(0, 120),
        artist: t.artist.name.slice(0, 120),
        album: (t.album?.title ?? "").slice(0, 120),
        cover: safeCover(t.album?.cover_big ?? t.album?.cover_medium),
        durationSec: Math.max(0, Math.round(t.duration ?? 0)),
        link: safeLink(t.link),
      });
      if (results.length >= 8) break;
    }
    cache.set(key, results);
    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}

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

/** Solo se aceptan carátulas servidas por el CDN de Deezer o Spotify (se guardan y se pintan como imagen). */
const safeCover = (url: string | undefined) => {
  try {
    const u = new URL(url ?? "");
    return u.protocol === "https:" && /(^|\.)(dzcdn\.net|scdn\.co)$/.test(u.hostname) ? u.href : "";
  } catch {
    return "";
  }
};

const safeLink = (url: string | undefined) => (url?.startsWith("https://www.deezer.com/") ? url : "");

/* ---------- Spotify (opcional): se usa solo si hay SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET ---------- */
const SPOTIFY_ACCOUNTS = process.env.SPOTIFY_ACCOUNTS_BASE || "https://accounts.spotify.com";
const SPOTIFY_API = process.env.SPOTIFY_API_BASE || "https://api.spotify.com";
let spotifyToken: { value: string; until: number } | null = null;

async function spotifyAccessToken(id: string, secret: string): Promise<string | null> {
  if (spotifyToken && spotifyToken.until > Date.now() + 30_000) return spotifyToken.value;
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    signal: AbortSignal.timeout(7000),
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  spotifyToken = { value: data.access_token, until: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

interface SpotifyTrack {
  id?: string;
  name?: string;
  duration_ms?: number;
  external_urls?: { spotify?: string };
  artists?: { name?: string }[];
  album?: { name?: string; images?: { url?: string; width?: number }[] };
}

async function searchSpotify(q: string, id: string, secret: string): Promise<TrackHit[] | null> {
  const token = await spotifyAccessToken(id, secret);
  if (!token) return null;
  const res = await fetch(`${SPOTIFY_API}/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(7000), headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { tracks?: { items?: SpotifyTrack[] } };
  const out: TrackHit[] = [];
  const seen = new Set<string>();
  for (const t of data.tracks?.items ?? []) {
    const artist = t.artists?.map((a) => a.name).filter(Boolean).join(", ");
    if (!t.id || !t.name || !artist) continue;
    const key = `${t.name}|${artist}|${t.album?.name ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const images = [...(t.album?.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
    out.push({
      id: t.id,
      title: t.name.slice(0, 120),
      artist: artist.slice(0, 120),
      album: (t.album?.name ?? "").slice(0, 120),
      cover: safeCover((images[1] ?? images[0])?.url),
      durationSec: Math.round((t.duration_ms ?? 0) / 1000),
      link: t.external_urls?.spotify?.startsWith("https://open.spotify.com/") ? t.external_urls.spotify : "",
      source: "spotify",
    });
    if (out.length >= 8) break;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });
  if (rateLimited(request, "music", 40)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const key = q.toLowerCase();
  const cached = cache.get(key);
  if (cached) return NextResponse.json({ results: cached }, { headers: CACHE_HEADERS });

  const spId = process.env.SPOTIFY_CLIENT_ID;
  const spSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (spId && spSecret) {
    try {
      const sp = await searchSpotify(q, spId, spSecret);
      if (sp) {
        cache.set(key, sp);
        return NextResponse.json({ results: sp }, { headers: CACHE_HEADERS });
      }
    } catch {
      /* si Spotify falla, se usa Deezer */
    }
  }

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
        source: "deezer",
      });
      if (results.length >= 8) break;
    }
    cache.set(key, results);
    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }
}

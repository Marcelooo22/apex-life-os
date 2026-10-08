import { NextResponse, type NextRequest } from "next/server";
import { formatKey } from "@/lib/music-keys";
import { rateLimited, TtlCache } from "@/lib/server/http";
import type { SongInfo } from "@/lib/songinfo";

/**
 * BPM y tono de una canción. Prueba, en orden:
 *  1) GetSongBPM (si hay GETSONGBPM_API_KEY): da tempo y tono.
 *  2) Deezer: a veces trae el BPM.
 *  3) Claude (si hay ANTHROPIC_API_KEY): estimación aproximada; se marca como tal.
 */
const cache = new TtlCache<SongInfo>(24 * 3_600_000, 500);
const GSB = process.env.GETSONGBPM_BASE || "https://api.getsong.co";
const ANTHROPIC = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";

const clampBpm = (n: unknown) => {
  const v = typeof n === "number" ? n : parseFloat(String(n ?? ""));
  return Number.isFinite(v) && v >= 40 && v <= 260 ? Math.round(v) : null;
};

const fold = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

interface GsbHit {
  id?: string;
  title?: string;
  tempo?: string;
  key_of?: string;
  artist?: { name?: string };
}

/** Entre los resultados, la versión que coincide en título y artista (no un remix ni otra canción). */
function bestMatch(list: GsbHit[], title: string, artist: string): GsbHit | undefined {
  const t = fold(title);
  const a = fold(artist);
  const sameArtist = (h: GsbHit) => !a || fold(h.artist?.name ?? "").includes(a) || a.includes(fold(h.artist?.name ?? "x"));
  const candidates = list.filter(sameArtist);
  return candidates.find((h) => fold(h.title ?? "") === t) ?? candidates.find((h) => fold(h.title ?? "").startsWith(t)) ?? candidates[0];
}

async function fromGetSongBpm(title: string, artist: string, apiKey: string): Promise<{ bpm: number | null; key: string | null } | null> {
  const search = await fetch(`${GSB}/search/?api_key=${encodeURIComponent(apiKey)}&type=both&lookup=${encodeURIComponent(`song:${title} artist:${artist}`)}`, { signal: AbortSignal.timeout(6000) });
  if (!search.ok) return null;
  const list = ((await search.json()) as { search?: GsbHit[] }).search;
  const hit = Array.isArray(list) ? bestMatch(list, title, artist) : undefined;
  if (!hit?.id) return null;
  let bpm = clampBpm(hit.tempo);
  let key = hit.key_of ?? null;
  if (bpm === null || !key) {
    const detail = await fetch(`${GSB}/song/?api_key=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(hit.id)}`, { signal: AbortSignal.timeout(6000) });
    if (detail.ok) {
      const song = ((await detail.json()) as { song?: { tempo?: string; key_of?: string } }).song;
      bpm ??= clampBpm(song?.tempo);
      key ??= song?.key_of ?? null;
    }
  }
  return { bpm, key };
}

async function fromDeezer(id: string): Promise<number | null> {
  const res = await fetch(`https://api.deezer.com/track/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  return clampBpm(((await res.json()) as { bpm?: number }).bpm);
}

async function fromClaude(title: string, artist: string, apiKey: string): Promise<{ bpm: number | null; key: string | null } | null> {
  const res = await fetch(`${ANTHROPIC}/v1/messages`, {
    method: "POST",
    signal: AbortSignal.timeout(12_000),
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: 'Eres un experto en música. Te dan una canción y un artista. Responde SOLO con JSON: {"bpm":número o null,"key":"G" o "Gm" o null,"confidence":"alta"|"media"|"baja"}. key es la tonalidad de la versión original (m = menor). Si no conoces la canción con seguridad, usa null. No inventes.',
      messages: [{ role: "user", content: `Canción: ${title}\nArtista: ${artist}` }],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: { type?: string; text?: string }[] };
  const text = (data.content ?? []).map((b) => b.text ?? "").join("");
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const j = JSON.parse(text.slice(a, b + 1)) as { bpm?: unknown; key?: unknown; confidence?: unknown };
    if (j.confidence === "baja") return null;
    return { bpm: clampBpm(j.bpm), key: typeof j.key === "string" && /^[A-Ga-g][#b♯♭]?m?$/.test(j.key.trim()) ? j.key.trim() : null };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const artist = (url.searchParams.get("artist") ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const id = (url.searchParams.get("id") ?? "").replace(/\D/g, "").slice(0, 16);
  if (title.length < 2) return NextResponse.json({ bpm: null, key: null, from: {}, approx: false } satisfies SongInfo);
  if (rateLimited(request, "songinfo", 20)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const cacheKey = `${title}|${artist}`.toLowerCase();
  const hit = cache.get(cacheKey);
  if (hit) return NextResponse.json(hit);

  const info: SongInfo = { bpm: null, key: null, from: {}, approx: false };
  const gsbKey = process.env.GETSONGBPM_API_KEY;
  const claudeKey = process.env.ANTHROPIC_API_KEY;

  if (gsbKey) {
    try {
      const r = await fromGetSongBpm(title, artist, gsbKey);
      if (r?.bpm) {
        info.bpm = r.bpm;
        info.from.bpm = "GetSongBPM";
      }
      if (r?.key) {
        info.key = formatKey(r.key);
        info.from.key = "GetSongBPM";
      }
    } catch { /* se prueba la siguiente fuente */ }
  }
  if (info.bpm === null && id) {
    try {
      const bpm = await fromDeezer(id);
      if (bpm) {
        info.bpm = bpm;
        info.from.bpm = "Deezer";
      }
    } catch { /* idem */ }
  }
  if ((info.bpm === null || info.key === null) && claudeKey) {
    try {
      const r = await fromClaude(title, artist, claudeKey);
      if (r?.bpm && info.bpm === null) {
        info.bpm = r.bpm;
        info.from.bpm = "IA";
        info.approx = true;
      }
      if (r?.key && info.key === null) {
        info.key = formatKey(r.key);
        info.from.key = "IA";
        info.approx = true;
      }
    } catch { /* sin estimación */ }
  }

  if (info.bpm !== null || info.key !== null) cache.set(cacheKey, info);
  return NextResponse.json(info);
}

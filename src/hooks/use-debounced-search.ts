"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SearchStatus = "idle" | "loading" | "ready" | "error";

interface Options<T> {
  fetcher: (query: string, signal: AbortSignal) => Promise<T[]>;
  /** Caracteres mínimos antes de consultar. */
  minChars?: number;
  /** Espera tras la última tecla (ms). */
  delay?: number;
}

/**
 * Buscador con espera (debounce), cancelación de consultas obsoletas y caché de la sesión.
 * No consulta nada hasta que el texto tiene `minChars` caracteres: abrir la vista no dispara ninguna búsqueda.
 */
export function useDebouncedSearch<T>({ fetcher, minChars = 2, delay = 300 }: Options<T>) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<{ status: SearchStatus; results: T[]; error: string; forQuery: string }>({
    status: "idle",
    results: [],
    error: "",
    forQuery: "",
  });
  const [attempt, setAttempt] = useState(0);
  const cache = useRef(new Map<string, T[]>());
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const term = query.trim();
  const searchable = term.length >= minChars;

  useEffect(() => {
    if (!searchable) return;
    const key = term.toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      const frame = requestAnimationFrame(() => setState({ status: "ready", results: cached, error: "", forQuery: term }));
      return () => cancelAnimationFrame(frame);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, status: "loading", error: "" }));
      fetcherRef
        .current(term, controller.signal)
        .then((results) => {
          cache.current.set(key, results);
          setState({ status: "ready", results, error: "", forQuery: term });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setState({ status: "error", results: [], error: error instanceof Error ? error.message : "Error de conexión", forQuery: term });
        });
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, searchable, delay, attempt]);

  const retry = useCallback(() => {
    cache.current.delete(term.toLowerCase());
    setAttempt((n) => n + 1);
  }, [term]);

  // Mientras el texto sea demasiado corto la vista vuelve a "idle" sin resultados.
  const view = searchable ? state : { status: "idle" as SearchStatus, results: [] as T[], error: "", forQuery: "" };
  // "pendiente": el texto cambió y aún no llega la respuesta de esa búsqueda.
  const pending = searchable && view.forQuery !== term && view.status !== "error";
  return { query, setQuery, term, searchable, pending, ...view, retry };
}

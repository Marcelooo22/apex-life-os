import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Las cuentas solo existen si hay un proyecto de Supabase configurado. */
export const cloudEnabled = () => Boolean(URL && KEY);
export const googleEnabled = () => process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!URL || !KEY) throw new Error("Supabase no está configurado");
  client ??= createClient(URL, KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "apex.auth" },
  });
  return client;
}

import { createClient } from "@supabase/supabase-js";

/**
 * Client anônimo sem sessão/cookies — para leituras públicas fora do ciclo de
 * request (ex.: sitemap). Só lê o que a RLS permite ao público.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

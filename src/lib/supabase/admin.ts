import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client com service_role. IGNORA RLS — use APENAS no servidor, em fluxos
 * confiáveis (verificação admin, escrita privilegiada). Nunca importe em
 * Client Components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

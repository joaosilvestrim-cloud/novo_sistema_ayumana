import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase para Server Components, Route Handlers e Server Actions.
 * Lê/escreve a sessão nos cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — ignorável quando há
            // middleware renovando a sessão.
          }
        },
      },
    }
  );
}

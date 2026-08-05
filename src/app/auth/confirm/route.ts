import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Processa os links de e-mail do Supabase (confirmação de cadastro,
 * redefinição de senha, convite). O formato novo manda ?token_hash=&type=,
 * e é aqui que ele vira sessão. Sem esta rota, o link cai no cliente e
 * costuma falhar como "expirado".
 *
 * Fluxo: e-mail -> /auth/confirm -> verifyOtp -> redireciona para o destino.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/painel";

  const destino = (path: string) => new URL(path, origin);

  if (!token_hash || !type) {
    return NextResponse.redirect(destino("/login?erro=link"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    // Token já usado (scanner de e-mail costuma queimar) ou vencido de fato.
    const rota = type === "recovery" ? "/esqueci-senha?erro=expirado" : "/login?erro=expirado";
    return NextResponse.redirect(destino(rota));
  }

  // Recuperação de senha vai para a tela de definir a nova; o resto, ao painel.
  if (type === "recovery") return NextResponse.redirect(destino("/redefinir-senha"));
  return NextResponse.redirect(destino(next));
}

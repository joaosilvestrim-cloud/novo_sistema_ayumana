"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell } from "@/lib/email";

export type ResetState = { done: boolean };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

export async function requestResetAction(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email.includes("@")) {
    const admin = createAdminClient();
    try {
      const { data } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${SITE}/redefinir-senha` },
      });
      const link = data?.properties?.action_link;
      if (link) {
        await sendEmail({
          to: email,
          subject: "Redefinir sua senha na Ayumana",
          kind: "senha",
          html: emailShell({
            preheader: "Link para criar uma nova senha.",
            heading: "Vamos criar uma senha nova",
            intro: "Recebemos um pedido para redefinir a senha da sua conta na Ayumana.",
            blocks: [
              {
                type: "steps",
                items: [
                  "Clique no botão abaixo",
                  "Escolha uma senha com pelo menos 8 caracteres",
                  "Entre no painel com a senha nova",
                ],
              },
              {
                type: "note",
                tone: "atencao",
                title: "Se não foi você",
                text: "Pode ignorar este e-mail. Sua senha atual continua valendo e nada muda.",
              },
            ],
            cta: { label: "Criar nova senha", url: link },
          }),
        });
      }
    } catch {
      // não revela se o e-mail existe
    }
  }

  return { done: true };
}

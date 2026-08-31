"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSupportRequest } from "@/lib/email";

export type LeadState = { ok: boolean; error?: string };

/** Lead institucional de líder de comunidade (formulário público do hub). */
export async function createLeadAction(_prev: LeadState, formData: FormData): Promise<LeadState> {
  const g = (k: string) => String(formData.get(k) ?? "").trim() || null;
  const contactEmail = g("contact_email");
  const contactName = g("contact_name");
  const communityName = g("community_name");
  if (!contactEmail || !contactEmail.includes("@")) return { ok: false, error: "Informe um e-mail válido." };
  if (!contactName && !communityName) return { ok: false, error: "Informe seu nome ou o da comunidade." };

  const admin = createAdminClient();
  const { error } = await admin.from("community_leads").insert({
    community_name: communityName,
    country_code: g("country_code"),
    contact_name: contactName,
    contact_email: contactEmail,
    message: g("message"),
    source_slug: g("source_slug"),
  });
  if (error) return { ok: false, error: "Não foi possível enviar agora. Tente pelo WhatsApp." };

  // Avisa o time por e-mail (reaproveita o canal de suporte).
  try {
    await sendSupportRequest({
      name: contactName || communityName,
      email: contactEmail,
      plan: "Parceria de comunidade",
      message: `Novo interesse de PARCERIA de comunidade.\n\nComunidade: ${communityName || "-"}\nPaís: ${g("country_code") || "-"}\nResponsável: ${contactName || "-"}\n\nMensagem: ${g("message") || "-"}`,
    });
  } catch { /* não derruba o lead */ }

  return { ok: true };
}

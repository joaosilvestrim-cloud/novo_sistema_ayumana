"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSupportRequest, SUPPORT_WHATSAPP } from "@/lib/email";
import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier } from "@/lib/types";

export type SupportResult = { whatsappUrl: string };

/**
 * Registra o pedido de ajuda, avisa o time por e-mail e devolve o link do
 * WhatsApp. O link é devolvido mesmo se o e-mail falhar: a pessoa nunca fica
 * sem atendimento por causa de um problema nosso.
 */
export async function requestSupportAction(mensagem: string): Promise<SupportResult> {
  const texto = (mensagem || "").trim().slice(0, 1000);
  const numero = SUPPORT_WHATSAPP;

  const saudacao = texto
    ? `Olá! Preciso de ajuda na Ayumana.\n\n${texto}`
    : "Olá! Preciso de ajuda na Ayumana.";
  const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(saudacao)}`;

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return { whatsappUrl };

    const admin = createAdminClient();
    const { data: prof } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", user.id)
      .maybeSingle();
    const { data: psy } = await admin
      .from("psychologists")
      .select("whatsapp, plan_tier")
      .eq("profile_id", user.id)
      .maybeSingle();

    await sendSupportRequest({
      name: (prof?.full_name as string) ?? null,
      email: (prof?.email as string) ?? user.email ?? null,
      phone: (psy?.whatsapp as string) ?? null,
      plan: psy?.plan_tier ? PLAN_LABEL[psy.plan_tier as PlanTier] : null,
      message: texto || null,
      profileId: user.id,
    });
  } catch {
    // nunca bloqueia o atendimento
  }

  return { whatsappUrl };
}

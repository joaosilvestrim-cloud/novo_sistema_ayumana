"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCustomer, createSubscription, isAsaasConfigured } from "@/lib/payments/asaas";

const STATUSES = ["pendente", "contatado", "aprovado", "recusado"];

export async function setWaitlistStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status)) return;
  const admin = createAdminClient();
  await admin.from("presenca_waitlist").update({ status }).eq("id", id);
  revalidatePath("/admin/presenca");
}

/**
 * Gera a cobrança do Presença no Asaas e devolve o link de pagamento pronto
 * para enviar ao inscrito. Se ele já é psicólogo cadastrado, deixa o plano
 * Presença pendente, para o webhook liberar automaticamente quando pagar.
 */
export async function generatePresencaChargeAction(formData: FormData): Promise<{ ok: boolean; error?: string; checkoutUrl?: string }> {
  const me = await requireAdmin();
  if (!isAsaasConfigured()) {
    return { ok: false, error: "O Asaas ainda não está ligado (falta a chave ASAAS_API_KEY). Enquanto isso, gere a cobrança pelo painel do Asaas." };
  }
  const admin = createAdminClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Inscrição não identificada." };

  const { data: w } = await admin
    .from("presenca_waitlist")
    .select("id, name, email, psychologist_id")
    .eq("id", id)
    .maybeSingle();
  const insc = w as { id: string; name: string | null; email: string | null; psychologist_id: string | null } | null;
  if (!insc) return { ok: false, error: "Inscrição não encontrada." };
  if (!insc.name || !insc.email) return { ok: false, error: "A inscrição precisa ter nome e e-mail." };

  const { data: plano } = await admin.from("plans").select("price_cents").eq("id", "presenca").maybeSingle();
  const valorReais = ((plano?.price_cents as number | undefined) ?? 29400) / 100;

  let existingCustomer: string | null = null;
  let externalRef = insc.id;
  if (insc.psychologist_id) {
    const { data: psy } = await admin.from("psychologists").select("asaas_customer_id").eq("id", insc.psychologist_id).maybeSingle();
    existingCustomer = (psy?.asaas_customer_id as string | null) ?? null;
    externalRef = insc.psychologist_id;
  }

  try {
    const customerId = await ensureCustomer({ existingId: existingCustomer, name: insc.name, email: insc.email });
    const { subscriptionId, checkoutUrl } = await createSubscription({
      customerId,
      valueReais: valorReais,
      description: "Plano Presença — Ayumana",
      externalReference: externalRef,
      cycle: "MONTHLY",
    });

    if (insc.psychologist_id) {
      await admin.from("psychologists").update({
        asaas_customer_id: customerId,
        asaas_subscription_id: subscriptionId,
        pending_plan_tier: "presenca",
        pending_billing_period: "monthly",
        pending_since: new Date().toISOString(),
      }).eq("id", insc.psychologist_id);
    }

    await admin.from("presenca_waitlist").update({
      status: "aprovado",
      checkout_url: checkoutUrl,
      asaas_subscription_id: subscriptionId,
      charge_created_by: me.id,
      charge_created_at: new Date().toISOString(),
    }).eq("id", id);
    revalidatePath("/admin/presenca");
    return { ok: true, checkoutUrl: checkoutUrl ?? undefined };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

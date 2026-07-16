"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isAsaasConfigured,
  ensureCustomer,
  createSubscription,
  cancelSubscription,
} from "@/lib/payments/asaas";
import type { PlanTier } from "@/lib/types";

const SELF_SERVICE: PlanTier[] = ["essencial", "destaque", "ideal"];
const PAID: PlanTier[] = ["destaque", "ideal"];

async function loadContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: psy } = await supabase
    .from("psychologists")
    .select("id, plan_tier, asaas_customer_id, asaas_subscription_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return { supabase, user, profile, psy };
}

export async function selectPlanAction(formData: FormData) {
  const plan = String(formData.get("plan") ?? "") as PlanTier;
  if (!SELF_SERVICE.includes(plan)) return;

  const ctx = await loadContext();
  if (!ctx || !ctx.psy) return;
  const admin = createAdminClient();

  // Downgrade para o Essencial: cancela assinatura ativa.
  if (plan === "essencial") {
    if (isAsaasConfigured() && ctx.psy.asaas_subscription_id) {
      try {
        await cancelSubscription(ctx.psy.asaas_subscription_id);
      } catch {
        // segue mesmo se o cancelamento remoto falhar
      }
    }
    await admin
      .from("psychologists")
      .update({
        plan_tier: "essencial",
        subscription_status: "cancelada",
        asaas_subscription_id: null,
      })
      .eq("id", ctx.psy.id);
    revalidatePath("/painel/assinatura");
    revalidatePath("/painel");
    redirect("/painel/assinatura?cancelado=1");
  }

  // Planos pagos.
  if (!PAID.includes(plan)) return;

  // Preço do plano.
  const supabase = await createClient();
  const { data: planRow } = await supabase
    .from("plans")
    .select("price_cents, name")
    .eq("id", plan)
    .single();
  const valueReais = (planRow?.price_cents ?? 0) / 100;

  // Modo dev (sem chaves): troca direta, assinatura "ativa" fictícia.
  if (!isAsaasConfigured()) {
    await admin
      .from("psychologists")
      .update({ plan_tier: plan, subscription_status: "ativa" })
      .eq("id", ctx.psy.id);
    revalidatePath("/painel/assinatura");
    revalidatePath("/painel");
    redirect("/painel/assinatura?dev=1");
  }

  // Fluxo real Asaas.
  const customerId = await ensureCustomer({
    existingId: ctx.psy.asaas_customer_id,
    name: ctx.profile?.full_name || "Psicólogo(a) Ayumana",
    email: ctx.profile?.email || ctx.user.email || "",
  });

  const { subscriptionId, checkoutUrl } = await createSubscription({
    customerId,
    valueReais,
    description: `Ayumana — Plano ${planRow?.name ?? plan}`,
    externalReference: ctx.psy.id,
  });

  await admin
    .from("psychologists")
    .update({
      plan_tier: plan,
      asaas_customer_id: customerId,
      asaas_subscription_id: subscriptionId,
      subscription_status: "atrasada", // ativa quando o 1º pagamento confirmar
    })
    .eq("id", ctx.psy.id);

  revalidatePath("/painel/assinatura");
  redirect(checkoutUrl ?? "/painel/assinatura?aguardando=1");
}

export async function cancelSubscriptionAction() {
  const ctx = await loadContext();
  if (!ctx || !ctx.psy) return;
  const admin = createAdminClient();

  if (isAsaasConfigured() && ctx.psy.asaas_subscription_id) {
    try {
      await cancelSubscription(ctx.psy.asaas_subscription_id);
    } catch {
      // ignora falha remota
    }
  }

  await admin
    .from("psychologists")
    .update({
      plan_tier: "essencial",
      subscription_status: "cancelada",
      asaas_subscription_id: null,
    })
    .eq("id", ctx.psy.id);

  revalidatePath("/painel/assinatura");
  revalidatePath("/painel");
  redirect("/painel/assinatura?cancelado=1");
}

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

/** Volta para a tela de assinatura mostrando o motivo da falha. */
function fail(msg: string): string {
  return `/painel/assinatura?erro=${encodeURIComponent(msg)}`;
}

/** Valida CPF (11) ou CNPJ (14) com dígito verificador. */
function validaCpfCnpj(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) {
    if (/^(\d)\1{10}$/.test(d)) return false;
    const calc = (len: number) => {
      let soma = 0;
      for (let i = 0; i < len; i++) soma += Number(d[i]) * (len + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
  }
  if (d.length === 14) {
    if (/^(\d)\1{13}$/.test(d)) return false;
    const calc = (len: number) => {
      const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let soma = 0;
      for (let i = 0; i < len; i++) soma += Number(d[i]) * pesos[i];
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
  }
  return false;
}

export async function selectPlanAction(formData: FormData) {
  const plan = String(formData.get("plan") ?? "") as PlanTier;
  if (!SELF_SERVICE.includes(plan)) {
    redirect(fail("Este plano não é contratável pelo site. Fale com a equipe."));
  }

  const ctx = await loadContext();
  if (!ctx) redirect("/login");
  if (!ctx.psy) {
    redirect(fail("Você ainda não tem um perfil profissional. Complete o cadastro em Meu perfil antes de assinar."));
  }
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

  // CPF/CNPJ: exigido pelo Asaas para criar o cliente. Só é pedido na primeira
  // assinatura; depois reusamos o customer id. NÃO guardamos esse dado (LGPD).
  const cpfCnpj = String(formData.get("cpf_cnpj") ?? "").replace(/\D/g, "");
  if (!ctx.psy.asaas_customer_id) {
    if (!cpfCnpj) {
      redirect(fail("Informe seu CPF ou CNPJ para emitir a cobrança."));
    }
    if (!validaCpfCnpj(cpfCnpj)) {
      redirect(fail("CPF ou CNPJ inválido. Confira os números e tente de novo."));
    }
  }

  // Fluxo real Asaas. Qualquer falha vira mensagem na tela, nunca silêncio.
  let dest = "/painel/assinatura?aguardando=1";
  try {
    // Troca de plano: cancela a assinatura anterior antes de criar a nova,
    // senão o psicólogo fica com duas cobranças ativas no Asaas.
    if (ctx.psy.asaas_subscription_id) {
      try {
        await cancelSubscription(ctx.psy.asaas_subscription_id);
      } catch {
        // se já não existir lá, segue
      }
    }

    const customerId = await ensureCustomer({
      existingId: ctx.psy.asaas_customer_id,
      name: ctx.profile?.full_name || "Psicólogo(a) Ayumana",
      email: ctx.profile?.email || ctx.user.email || "",
      cpfCnpj: cpfCnpj || null,
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

    dest = checkoutUrl ?? "/painel/assinatura?aguardando=1";
  } catch (e) {
    dest = fail(`Asaas: ${(e as Error).message}`);
  }

  revalidatePath("/painel/assinatura");
  redirect(dest);
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

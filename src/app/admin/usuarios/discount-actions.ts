"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAsaasConfigured, updateSubscriptionValue } from "@/lib/payments/asaas";
import { chargeCents, periodBaseCents, couponEndsAt, type BillingPeriod, type CouponDuration } from "@/lib/pricing";

const DURATIONS: CouponDuration[] = ["first_payment", "first_year", "forever"];

function volta(profileId: string, msg: string, tipo: "ok" | "erro" = "ok"): never {
  redirect(`/admin/usuarios/${profileId}?${tipo}=${encodeURIComponent(msg)}`);
}

/**
 * Aplica um desconto direto na conta do cliente, sem código.
 * - Fica reservado e entra sozinho quando o cliente assinar.
 * - Se ele já tem assinatura paga ativa, o valor no Asaas é ajustado na hora.
 */
export async function applyDiscountAction(formData: FormData) {
  await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  const pct = Math.round(Number(formData.get("percent") ?? 0));
  const duration = String(formData.get("duration") ?? "first_year") as CouponDuration;
  if (!profileId) return;
  if (!(pct >= 1 && pct <= 100)) volta(profileId, "O desconto deve ser entre 1 e 100.", "erro");
  if (!DURATIONS.includes(duration)) volta(profileId, "Duração inválida.", "erro");

  const admin = createAdminClient();
  const { data: psy } = await admin
    .from("psychologists")
    .select("id, plan_tier, billing_period, subscription_status, asaas_subscription_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!psy) volta(profileId, "Este usuário não tem perfil profissional.", "erro");

  const update: Record<string, unknown> = {
    admin_discount_pct: pct,
    admin_discount_duration: duration,
  };

  // Se já é assinante pago, ajusta a cobrança em vigor.
  const ativo = psy.subscription_status === "ativa" && psy.plan_tier !== "essencial";
  if (ativo && psy.asaas_subscription_id) {
    const period: BillingPeriod = psy.billing_period === "yearly" ? "yearly" : "monthly";
    const { data: planRow } = await admin.from("plans").select("price_cents").eq("id", psy.plan_tier).maybeSingle();
    const monthly = (planRow?.price_cents as number) ?? 0;
    const novo = chargeCents(monthly, period, pct);

    if (isAsaasConfigured()) {
      try {
        await updateSubscriptionValue(psy.asaas_subscription_id, novo / 100);
      } catch (e) {
        volta(profileId, `Desconto salvo, mas falhou no Asaas: ${(e as Error).message}`, "erro");
      }
    }
    const fim = couponEndsAt(duration, period);
    update.coupon_code = null;
    update.coupon_pct = pct;
    update.coupon_ends_at = fim ? fim.toISOString() : null;
  }

  await admin.from("psychologists").update(update).eq("id", psy.id);
  revalidatePath(`/admin/usuarios/${profileId}`);
  volta(profileId, ativo ? `Desconto de ${pct}% aplicado à assinatura atual.` : `Desconto de ${pct}% reservado. Entra quando o cliente assinar.`);
}

/** Remove o desconto do admin. Se houver assinatura ativa, volta ao preço cheio. */
export async function removeDiscountAction(formData: FormData) {
  await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) return;

  const admin = createAdminClient();
  const { data: psy } = await admin
    .from("psychologists")
    .select("id, plan_tier, billing_period, subscription_status, asaas_subscription_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!psy) return;

  const ativo = psy.subscription_status === "ativa" && psy.plan_tier !== "essencial";
  if (ativo && psy.asaas_subscription_id && isAsaasConfigured()) {
    const period: BillingPeriod = psy.billing_period === "yearly" ? "yearly" : "monthly";
    const { data: planRow } = await admin.from("plans").select("price_cents").eq("id", psy.plan_tier).maybeSingle();
    const monthly = (planRow?.price_cents as number) ?? 0;
    const cheio = periodBaseCents(monthly, period);
    try {
      await updateSubscriptionValue(psy.asaas_subscription_id, cheio / 100);
    } catch {
      // segue, volta a cobrar cheio no próximo ciclo de qualquer forma
    }
  }

  await admin
    .from("psychologists")
    .update({
      admin_discount_pct: null,
      admin_discount_duration: null,
      coupon_code: null,
      coupon_pct: null,
      coupon_ends_at: null,
    })
    .eq("id", psy.id);
  revalidatePath(`/admin/usuarios/${profileId}`);
  volta(profileId, "Desconto removido.");
}

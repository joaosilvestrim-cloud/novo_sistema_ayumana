import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSubscriptionValue, isAsaasConfigured } from "@/lib/payments/asaas";
import { periodBaseCents, type BillingPeriod } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * Quando o desconto de um cupom expira (coupon_ends_at no passado), a cobrança
 * volta ao preço cheio. Atualiza o valor da assinatura no Asaas e limpa o cupom.
 * Roda por cron diário da Vercel.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const agora = new Date().toISOString();

  const { data, error } = await admin
    .from("psychologists")
    .select("id, plan_tier, billing_period, asaas_subscription_id, coupon_code, coupon_ends_at")
    .not("coupon_code", "is", null)
    .not("coupon_ends_at", "is", null)
    .lte("coupon_ends_at", agora);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const linhas = (data ?? []) as {
    id: string;
    plan_tier: string;
    billing_period: BillingPeriod;
    asaas_subscription_id: string | null;
    coupon_code: string | null;
    coupon_ends_at: string | null;
  }[];

  // Preços dos planos.
  const { data: planos } = await admin.from("plans").select("id, price_cents");
  const precoMensal = new Map<string, number>(
    (planos ?? []).map((p) => [p.id as string, p.price_cents as number])
  );

  let ajustados = 0;
  for (const p of linhas) {
    const monthly = precoMensal.get(p.plan_tier) ?? 0;
    const cheioCents = periodBaseCents(monthly, p.billing_period === "yearly" ? "yearly" : "monthly");

    // Atualiza o valor no Asaas. Falha aqui não limpa o cupom, para tentar de novo amanhã.
    if (isAsaasConfigured() && p.asaas_subscription_id) {
      try {
        await updateSubscriptionValue(p.asaas_subscription_id, cheioCents / 100);
      } catch {
        continue;
      }
    }

    await admin
      .from("psychologists")
      .update({ coupon_code: null, coupon_pct: null, coupon_ends_at: null })
      .eq("id", p.id);
    ajustados++;
  }

  return NextResponse.json({ ok: true, ajustados });
}

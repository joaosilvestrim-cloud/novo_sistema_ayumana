import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPlanActivated } from "@/lib/email";
import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier, SubscriptionStatus } from "@/lib/types";

// Eventos que ativam/renovam a assinatura.
const ACTIVATE = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
// Eventos que cancelam/rebaixam.
const CANCEL = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_DELETED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "SUBSCRIPTION_DELETED",
]);
// Pagamento em atraso.
const OVERDUE = new Set(["PAYMENT_OVERDUE"]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Psy = {
  id: string;
  plan_tier: PlanTier;
  pending_plan_tier: PlanTier | null;
};

/**
 * Acha o psicólogo por três caminhos, do mais confiável para o menos.
 * O externalReference é o nosso próprio id, enviado ao criar a assinatura:
 * é o que salva quando a cobrança nasce fora do fluxo do site.
 */
async function acharPsicologo(
  supabase: ReturnType<typeof createAdminClient>,
  ref: { subscriptionId?: string; externalReference?: string; customerId?: string }
): Promise<Psy | null> {
  const cols = "id, plan_tier, pending_plan_tier";

  if (ref.subscriptionId) {
    const { data } = await supabase
      .from("psychologists").select(cols)
      .eq("asaas_subscription_id", ref.subscriptionId).maybeSingle();
    if (data) return data as Psy;
  }
  if (ref.externalReference && UUID.test(ref.externalReference)) {
    const { data } = await supabase
      .from("psychologists").select(cols)
      .eq("id", ref.externalReference).maybeSingle();
    if (data) return data as Psy;
  }
  if (ref.customerId) {
    const { data } = await supabase
      .from("psychologists").select(cols)
      .eq("asaas_customer_id", ref.customerId).maybeSingle();
    if (data) return data as Psy;
  }
  return null;
}

/** Vencimento do próximo ciclo, um mês depois da cobrança paga. */
function fimDoPeriodo(dueDate?: string): string | null {
  if (!dueDate) return null;
  const d = new Date(`${dueDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export async function POST(request: NextRequest) {
  /*
    Autenticidade do aviso. Sem isso, qualquer um poderia mandar um
    PAYMENT_CONFIRMED forjado e liberar plano pago de graça.
    Em produção falha fechado: sem token configurado, ninguém entra.
  */
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const got = request.headers.get("asaas-access-token");
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "ASAAS_WEBHOOK_TOKEN não configurada" },
        { status: 503 }
      );
    }
    // Em desenvolvimento seguimos, para dar para testar sem configurar nada.
  } else if (got !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.event) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const event: string = body.event;
  const payment = body.payment ?? body.subscription ?? {};
  const paymentId: string = payment.id ?? body.id ?? "unknown";

  const supabase = createAdminClient();

  // Idempotência: a chave é evento + cobrança. Se já entrou, não reprocessa.
  const eventKey = `${event}:${paymentId}`;
  const { error: dupErr } = await supabase
    .from("payment_events")
    .insert({ id: eventKey, event, raw: body });
  if (dupErr) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  /** Fecha o evento no log, dizendo o que foi feito. */
  const fechar = async (psyId: string | null, handled: boolean, note: string) => {
    await supabase
      .from("payment_events")
      .update({ psychologist_id: psyId, handled, note })
      .eq("id", eventKey);
  };

  const psy = await acharPsicologo(supabase, {
    subscriptionId: payment.subscription ?? body.subscription?.id,
    externalReference: payment.externalReference ?? body.subscription?.externalReference,
    customerId: payment.customer,
  });

  if (!psy) {
    // Responde 200 de propósito: erro faria o Asaas pausar a fila inteira.
    // O evento fica marcado como não tratado e aparece em Admin > Integrações.
    await fechar(null, false, "Nenhum psicólogo casou com esta cobrança.");
    return NextResponse.json({ ok: true, ignored: "psicólogo não encontrado" });
  }

  const update: Record<string, unknown> = {};
  let resumo = "";

  if (ACTIVATE.has(event)) {
    update.subscription_status = "ativa" satisfies SubscriptionStatus;
    const fim = fimDoPeriodo(payment.dueDate);
    if (fim) update.subscription_period_end = fim;

    // É aqui que o plano contratado passa a valer de verdade.
    if (psy.pending_plan_tier) {
      update.plan_tier = psy.pending_plan_tier;
      update.pending_plan_tier = null;
      update.pending_since = null;
      resumo = `Pagamento confirmado. Plano liberado: ${psy.pending_plan_tier}.`;
    } else {
      resumo = "Pagamento confirmado. Assinatura renovada.";
    }
  } else if (OVERDUE.has(event)) {
    update.subscription_status = "atrasada" satisfies SubscriptionStatus;
    resumo = "Cobrança venceu sem pagamento.";
  } else if (CANCEL.has(event)) {
    update.subscription_status = "cancelada" satisfies SubscriptionStatus;
    update.plan_tier = "essencial";
    update.pending_plan_tier = null;
    update.pending_since = null;
    update.asaas_subscription_id = null;
    resumo = "Assinatura encerrada. Voltou ao plano gratuito.";
  } else {
    await fechar(psy.id, false, `Evento sem ação definida: ${event}.`);
    return NextResponse.json({ ok: true, ignored: event });
  }

  const { error: updErr } = await supabase
    .from("psychologists")
    .update(update)
    .eq("id", psy.id);

  if (updErr) {
    await fechar(psy.id, false, `Falha ao gravar: ${updErr.message}`);
    return NextResponse.json({ ok: true, error: updErr.message });
  }

  // Avisa o psicólogo que o plano entrou no ar. Falha de e-mail não derruba
  // o webhook: o pagamento já foi aplicado no banco acima.
  if (ACTIVATE.has(event) && psy.pending_plan_tier) {
    try {
      const { data: dono } = await supabase
        .from("psychologists")
        .select("profile_id, display_name")
        .eq("id", psy.id)
        .maybeSingle();
      if (dono?.profile_id) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", dono.profile_id)
          .maybeSingle();
        if (prof?.email) {
          await sendPlanActivated(
            prof.email as string,
            (prof.full_name as string) ?? (dono.display_name as string) ?? null,
            PLAN_LABEL[psy.pending_plan_tier]
          );
        }
      }
    } catch {
      // segue
    }
  }

  await fechar(psy.id, true, resumo);
  return NextResponse.json({ ok: true });
}

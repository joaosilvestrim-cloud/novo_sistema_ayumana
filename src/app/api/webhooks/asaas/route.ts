import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/lib/types";

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

export async function POST(request: NextRequest) {
  // Verificação de autenticidade via token configurado no painel do Asaas.
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const got = request.headers.get("asaas-access-token");
  if (expected && got !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.event) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const event: string = body.event;
  const payment = body.payment ?? body.subscription ?? {};
  const paymentId: string = payment.id ?? body.id ?? "unknown";
  const subscriptionId: string | undefined = payment.subscription ?? body.subscription?.id;
  const customerId: string | undefined = payment.customer;

  const supabase = createAdminClient();

  // Idempotência: registra o evento; se já existe, ignora.
  const eventKey = `${event}:${paymentId}`;
  const { error: dupErr } = await supabase
    .from("payment_events")
    .insert({ id: eventKey, event, raw: body });
  if (dupErr) {
    // Conflito de PK => já processado.
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Localiza o psicólogo pela assinatura ou pelo cliente.
  let query = supabase.from("psychologists").select("id, plan_tier");
  if (subscriptionId) query = query.eq("asaas_subscription_id", subscriptionId);
  else if (customerId) query = query.eq("asaas_customer_id", customerId);
  else return NextResponse.json({ ok: true, ignored: "sem referência" });

  const { data: psy } = await query.maybeSingle();
  if (!psy) return NextResponse.json({ ok: true, ignored: "psicólogo não encontrado" });

  const update: Record<string, unknown> = {};

  if (ACTIVATE.has(event)) {
    update.subscription_status = "ativa" satisfies SubscriptionStatus;
    if (payment.dueDate) update.subscription_period_end = payment.dueDate;
  } else if (OVERDUE.has(event)) {
    update.subscription_status = "atrasada" satisfies SubscriptionStatus;
  } else if (CANCEL.has(event)) {
    update.subscription_status = "cancelada" satisfies SubscriptionStatus;
    update.plan_tier = "essencial";
    update.asaas_subscription_id = null;
  } else {
    return NextResponse.json({ ok: true, ignored: event });
  }

  await supabase.from("psychologists").update(update).eq("id", psy.id);
  return NextResponse.json({ ok: true });
}

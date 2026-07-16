import { Check, CalendarClock, Info } from "lucide-react";
import { getMyPsychologist } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAsaasConfigured } from "@/lib/payments/asaas";
import { Badge } from "@/components/ui/badge";
import {
  SUBSCRIPTION_LABELS,
  type Plan,
} from "@/lib/types";
import { selectPlanAction, cancelSubscriptionAction } from "./actions";

export const metadata = { title: "Assinatura" };

const PAID = new Set(["destaque", "ideal"]);

function fmtDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return null;
  }
}

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const psy = await getMyPsychologist();
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").order("sort_order");
  const plans = (data as Plan[]) ?? [];
  const current = psy?.plan_tier ?? "essencial";
  const status = psy?.subscription_status ?? "nenhuma";
  const s = SUBSCRIPTION_LABELS[status];
  const renewal = fmtDate(psy?.subscription_period_end ?? null);
  const hasActivePaid = PAID.has(current) && status !== "cancelada";

  const notice =
    sp.dev
      ? { tone: "warning" as const, text: "Plano trocado em modo de teste (pagamento não configurado)." }
      : sp.aguardando
      ? { tone: "warning" as const, text: "Assinatura criada. Conclua o pagamento para ativá-la." }
      : sp.cancelado
      ? { tone: "neutral" as const, text: "Assinatura cancelada. Você voltou ao plano Essencial." }
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Assinatura</h1>
        <p className="mt-1 text-foreground-muted">
          Escolha seu plano. Cobrança mensal via Asaas (Pix, boleto ou cartão),
          sem fidelidade.
        </p>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            notice.tone === "warning"
              ? "border-yellow-200 bg-yellow-400/10 text-yellow-700"
              : "border-border bg-surface-muted text-foreground-muted"
          }`}
        >
          <Info className="h-4 w-4 shrink-0" />
          {notice.text}
        </div>
      )}

      {/* Status atual */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground-muted">Plano atual</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xl font-semibold text-brand-dark">
                {plans.find((p) => p.id === current)?.name ?? "Essencial"}
              </span>
              {current !== "essencial" && <Badge tone={s.tone}>{s.label}</Badge>}
            </div>
            {hasActivePaid && renewal && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground-muted">
                <CalendarClock className="h-4 w-4" />
                {status === "atrasada"
                  ? "Aguardando confirmação do pagamento"
                  : `Renova em ${renewal}`}
              </p>
            )}
          </div>

          {hasActivePaid && (
            <form action={cancelSubscriptionAction}>
              <button className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted">
                Cancelar assinatura
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Planos */}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const active = plan.id === current;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 ${
                active ? "border-brand ring-2 ring-brand/20" : "border-border"
              } bg-background`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg">{plan.name}</h2>
                {active && <Badge tone="success">Plano atual</Badge>}
              </div>
              <p className="mt-1 text-2xl font-semibold text-brand-dark">
                {plan.price_label}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>

              {!plan.is_selfservice ? (
                <p className="mt-5 rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground-muted">
                  Plano Presença tem onboarding humano e lista de espera. Fale com
                  a equipe.
                </p>
              ) : active ? (
                <button
                  disabled
                  className="mt-5 h-10 w-full rounded-lg border border-border text-sm text-foreground-muted"
                >
                  Selecionado
                </button>
              ) : (
                <form action={selectPlanAction} className="mt-5">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    className={`h-10 w-full rounded-lg text-sm font-medium transition-colors ${
                      plan.id === "essencial"
                        ? "border border-border text-foreground-muted hover:bg-surface-muted"
                        : "bg-primary text-primary-foreground hover:bg-primary-hover"
                    }`}
                  >
                    {plan.id === "essencial"
                      ? "Voltar ao Essencial"
                      : `Assinar ${plan.name}`}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {!isAsaasConfigured() && (
        <p className="text-center text-xs text-foreground-muted">
          Pagamento em modo de teste — configure <code>ASAAS_API_KEY</code> para
          ativar o checkout real.
        </p>
      )}
    </div>
  );
}

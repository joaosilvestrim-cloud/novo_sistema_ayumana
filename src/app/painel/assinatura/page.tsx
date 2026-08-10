import { CalendarClock, Info } from "lucide-react";
import { getMyPsychologist } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAsaasConfigured } from "@/lib/payments/asaas";
import { trialAtivo, trialDiasRestantes } from "@/lib/plan-features";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { Badge } from "@/components/ui/badge";
import { PlanCheckout } from "@/components/painel/plan-checkout";
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
  // Só pedimos CPF/CNPJ na primeira assinatura (depois reusamos o cliente no Asaas).
  const needsCpf = !psy?.asaas_customer_id;
  // Assinatura criada e ainda sem pagamento confirmado.
  const aguardando = !!psy?.pending_plan_tier;
  // Teste gratuito em andamento?
  const emTeste = psy ? trialAtivo(psy) : false;
  const diasTeste = psy ? trialDiasRestantes(psy) : 0;
  const planoTeste = psy?.trial_tier ? PLAN_LABEL[psy.trial_tier] : null;

  const erro = typeof sp.erro === "string" ? sp.erro : null;
  const notice =
    erro
      ? { tone: "danger" as const, text: erro }
      : sp.dev
      ? { tone: "warning" as const, text: "Plano trocado em modo de teste (pagamento não configurado)." }
      : sp.aguardando
      ? { tone: "warning" as const, text: "Assinatura criada. Conclua o pagamento para ativá-la." }
      : sp.cancelado
      ? { tone: "neutral" as const, text: "Assinatura cancelada. Você voltou ao plano Raiz." }
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
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            notice.tone === "danger"
              ? "border-danger/30 bg-danger/10 text-danger"
              : notice.tone === "warning"
              ? "border-yellow-200 bg-yellow-400/10 text-yellow-700"
              : "border-border bg-surface-muted text-foreground-muted"
          }`}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {notice.text}
        </div>
      )}

      {/* Assinatura criada, esperando o pagamento cair */}
      {aguardando && (
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-400/10 p-5">
          <p className="font-medium text-yellow-800">
            Falta pagar para o plano {PLAN_LABEL[psy!.pending_plan_tier!]} entrar no ar.
          </p>
          <p className="mt-1 text-sm text-yellow-900/90">
            A cobrança foi emitida no Asaas e está esperando o pagamento. Assim que
            cair, seu plano é liberado automaticamente e você recebe um aviso.
            Você continua no plano {PLAN_LABEL[current]} até lá.
          </p>
          <p className="mt-2 text-xs text-yellow-900/70">
            Pagou por Pix e ainda aparece assim? O Asaas leva alguns minutos para
            confirmar. Se passar de uma hora, fale com a gente pelo botão de ajuda.
          </p>
        </div>
      )}

      {/* Teste gratuito em andamento */}
      {emTeste && planoTeste && (
        <div className="rounded-2xl border border-brand/40 bg-brand/5 p-5">
          <p className="font-medium text-brand-dark">
            Você está testando o plano {planoTeste} de graça.
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {diasTeste === 1 ? "Termina amanhã." : `Faltam ${diasTeste} dias.`} Quando o
            teste acabar, seu perfil volta para o plano {PLAN_LABEL[current]} e você perde
            prioridade na busca, vídeo de apresentação e participação no fórum. Assine
            antes para não perder nada.
          </p>
        </div>
      )}

      {/* Status atual */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-foreground-muted">Plano atual</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xl font-semibold text-brand-dark">
                {plans.find((p) => p.id === current)?.name ?? "Raiz"}
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

      {/* Planos pagos com período e cupom */}
      <PlanCheckout
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          price_cents: p.price_cents,
          features: p.features,
          is_selfservice: p.is_selfservice,
        }))}
        current={current}
        needsCpf={needsCpf}
      />

      {/* Presença e volta ao Raiz */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Presença</h2>
          <p className="mt-1 text-2xl font-semibold text-brand-dark">R$ 297/mês</p>
          <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
            O Presença tem onboarding humano e vaga limitada. A entrada é por
            contato com a equipe.
          </p>
        </div>

        {current !== "essencial" && (
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-lg">Voltar ao Raiz</h2>
            <p className="mt-1 text-sm text-foreground-muted">
              O plano gratuito. Seu perfil continua no ar, sem os recursos pagos.
            </p>
            <form action={selectPlanAction} className="mt-4">
              <input type="hidden" name="plan" value="essencial" />
              <button className="h-10 w-full rounded-lg border border-border text-sm font-medium text-foreground-muted hover:bg-surface-muted">
                Voltar ao plano gratuito
              </button>
            </form>
          </div>
        )}
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

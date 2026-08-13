import Link from "next/link";
import { CreditCard, AlertCircle, Gift, CheckCircle2 } from "lucide-react";
import { getMetrics } from "@/lib/admin";
import { isAsaasConfigured, asaasEnv } from "@/lib/payments/asaas";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PlanPriceEditor } from "@/components/admin/plan-price-editor";
import { grantTrialAllAction, endTrialAllAction } from "./actions";
import { formatPrice } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { type PlanTier, type SubscriptionStatus } from "@/lib/types";

export const metadata = { title: "Assinaturas" };

type GrupoRow = {
  id: string; display_name: string | null; slug: string | null;
  plan_tier: PlanTier; subscription_status: SubscriptionStatus;
  pending_plan_tier: PlanTier | null; pending_billing_period: string | null; billing_period: string | null;
  trial_tier: PlanTier | null; trial_ends_at: string | null;
};

function Grupo({
  titulo, descricao, rows, plano, badge, vazio,
}: {
  titulo: string;
  descricao: string;
  rows: GrupoRow[];
  plano: (r: GrupoRow) => string;
  badge: (r: GrupoRow) => { tone: "success" | "warning" | "brand" | "neutral"; label: string };
  vazio: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg">{titulo} ({rows.length})</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">{descricao}</p>
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-foreground-muted">{vazio}</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => {
            const b = badge(r);
            return (
              <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  {r.slug ? (
                    <Link href={`/psicologo/${r.slug}`} target="_blank" className="font-medium text-heading hover:text-brand-dark">
                      {r.display_name || "—"}
                    </Link>
                  ) : (
                    <span className="font-medium text-heading">{r.display_name || "—"}</span>
                  )}
                  <p className="text-xs text-foreground-muted">{plano(r)}</p>
                </div>
                <Badge tone={b.tone}>{b.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default async function AdminAssinaturasPage() {
  const m = await getMetrics();
  const supabase = createAdminClient();

  const nowIso = new Date().toISOString();

  // Planos pagos, para editar o preço.
  const { data: planosPagos } = await supabase
    .from("plans")
    .select("id, name, price_cents")
    .in("id", ["destaque", "ideal", "presenca"])
    .order("sort_order");

  // Todo mundo com algum sinal de plano: pago, aguardando pagamento ou em teste.
  const { data: subs } = await supabase
    .from("psychologists")
    .select("id, display_name, slug, plan_tier, subscription_status, subscription_period_end, pending_plan_tier, pending_billing_period, billing_period, trial_tier, trial_ends_at, asaas_subscription_id")
    .or(`plan_tier.neq.essencial,pending_plan_tier.not.is.null,trial_ends_at.gt.${nowIso}`)
    .order("display_name");

  type Sub = {
    id: string; display_name: string | null; slug: string | null;
    plan_tier: PlanTier; subscription_status: SubscriptionStatus; subscription_period_end: string | null;
    pending_plan_tier: PlanTier | null; pending_billing_period: string | null; billing_period: string | null;
    trial_tier: PlanTier | null; trial_ends_at: string | null; asaas_subscription_id: string | null;
  };
  const all = (subs as Sub[]) ?? [];

  const emTrial = (r: Sub) => !!r.trial_ends_at && new Date(r.trial_ends_at) > new Date();

  // Cada um cai em um único grupo, por prioridade.
  const ativos: Sub[] = [];
  const aguardando: Sub[] = [];
  const emTesteList: Sub[] = [];
  const cortesia: Sub[] = [];
  for (const r of all) {
    if (r.subscription_status === "ativa" && r.plan_tier !== "essencial") ativos.push(r);
    else if (r.pending_plan_tier || r.subscription_status === "atrasada") aguardando.push(r);
    else if (emTrial(r)) emTesteList.push(r);
    else if (r.plan_tier !== "essencial") cortesia.push(r);
  }
  const emTeste = emTesteList.length;

  const periodoLabel = (p: string | null) => (p === "yearly" ? "anual" : "mensal");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Assinaturas</h1>
        <p className="mt-1 text-foreground-muted">
          Receita recorrente e assinantes dos planos pagos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-heading">
            {formatPrice(m.assinaturas.mrrCents) ?? "R$ 0,00"}
          </p>
          <p className="text-sm text-foreground-muted">MRR estimado</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-3xl font-semibold text-green-600">{m.assinaturas.ativas}</p>
          <p className="text-sm text-foreground-muted">Assinaturas ativas</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-3xl font-semibold text-yellow-600">{m.assinaturas.atrasadas}</p>
          <p className="text-sm text-foreground-muted">Pagamentos pendentes</p>
        </div>
      </div>

      {/* Teste gratuito */}
      <section className="rounded-2xl border border-brand/40 bg-brand/5 p-6">
        <h2 className="text-lg">Teste gratuito do plano Voz</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Libera os recursos do Voz por 30 dias para todos os psicólogos. A expiração é
          automática: quando o prazo vence, cada perfil volta sozinho ao plano contratado,
          sem depender de nenhuma rotina agendada.
        </p>
        <p className="mt-2 text-sm">
          <strong className="text-heading">{emTeste}</strong> perfis com teste ativo agora.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={grantTrialAllAction}>
            <ConfirmButton
              message="Conceder 30 dias do plano Voz a TODOS os psicólogos? Isso reinicia o prazo de quem já está em teste."
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              <Gift className="h-4 w-4" /> Conceder 30 dias a todos
            </ConfirmButton>
          </form>
          {emTeste > 0 && (
            <form action={endTrialAllAction}>
              <ConfirmButton
                message="Encerrar o teste de todos agora? Cada perfil volta imediatamente ao plano contratado."
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-danger/40 px-4 text-sm font-medium text-danger hover:bg-danger/10"
              >
                Encerrar teste de todos
              </ConfirmButton>
            </form>
          )}
        </div>
      </section>

      {/* Assinantes por plano */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Assinantes por plano</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["essencial", "destaque", "ideal", "presenca"] as PlanTier[]).map((p) => (
            <div key={p} className="rounded-xl border border-border p-4">
              <p className="text-2xl font-semibold text-heading">{m.planos[p]}</p>
              <p className="text-sm text-foreground-muted">{PLAN_LABEL[p]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Editor de preços */}
      <PlanPriceEditor plans={(planosPagos as { id: string; name: string; price_cents: number }[]) ?? []} />

      {/* Grupos por estado real */}
      <Grupo
        titulo="Pagantes ativos"
        descricao="Pagamento confirmado no Asaas. Estes geram receita."
        rows={ativos}
        plano={(r) => `${PLAN_LABEL[r.plan_tier]} · ${periodoLabel(r.billing_period)}`}
        badge={() => ({ tone: "success" as const, label: "Ativa" })}
        vazio="Ninguém pagante ainda. Aparece aqui quando o primeiro pagamento confirmar."
      />

      <Grupo
        titulo="Aguardando pagamento"
        descricao="Assinaram e a cobrança foi emitida, mas o pagamento não confirmou. Continuam no plano anterior até pagar."
        rows={aguardando}
        plano={(r) => r.pending_plan_tier
          ? `Quer ${PLAN_LABEL[r.pending_plan_tier]} · ${periodoLabel(r.pending_billing_period)}`
          : `${PLAN_LABEL[r.plan_tier]} · cobrança vencida`}
        badge={() => ({ tone: "warning" as const, label: "Aguardando" })}
        vazio="Ninguém aguardando pagamento."
      />

      <Grupo
        titulo="Em teste gratuito"
        descricao="Usando os recursos do plano de graça. Quando o teste vence, voltam ao plano contratado."
        rows={emTesteList}
        plano={(r) => `Testando ${PLAN_LABEL[r.trial_tier ?? "ideal"]}${r.trial_ends_at ? ` até ${new Date(r.trial_ends_at).toLocaleDateString("pt-BR")}` : ""}`}
        badge={() => ({ tone: "brand" as const, label: "Teste" })}
        vazio="Ninguém em teste agora."
      />

      <Grupo
        titulo="Cortesia / manual"
        descricao="Plano pago atribuído na mão (demo, parceria, Estúdio), sem cobrança no Asaas."
        rows={cortesia}
        plano={(r) => `${PLAN_LABEL[r.plan_tier]} · sem cobrança`}
        badge={() => ({ tone: "neutral" as const, label: "Manual" })}
        vazio="Nenhum plano atribuído manualmente."
      />

      {/*
        O aviso olha a configuração, não o faturamento. Antes ele aparecia
        sempre que o MRR era zero, dizendo que faltava configurar o Asaas
        mesmo com a chave no ar.
      */}
      {!isAsaasConfigured() ? (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cobrança recorrente desligada nesta implantação: falta a variável
            <code className="mx-1">ASAAS_API_KEY</code>. Os planos pagos são atribuídos em modo de teste.
            <Link href="/admin/integracoes" className="ml-1 font-medium underline">Ver diagnóstico</Link>
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-foreground-muted">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>
            Cobrança recorrente ligada no Asaas
            <strong className="mx-1 text-heading">{asaasEnv() === "production" ? "produção" : "sandbox"}</strong>.
            {m.assinaturas.mrrCents === 0 && " Ainda não há pagamento confirmado, por isso o faturamento está zerado."}
            <Link href="/admin/integracoes" className="ml-1 font-medium underline">Testar conexão</Link>
          </span>
        </div>
      )}
    </div>
  );
}

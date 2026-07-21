import Link from "next/link";
import { CreditCard, AlertCircle, Gift } from "lucide-react";
import { getMetrics } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { grantTrialAllAction, endTrialAllAction } from "./actions";
import { formatPrice } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { SUBSCRIPTION_LABELS, type PlanTier, type SubscriptionStatus } from "@/lib/types";

export const metadata = { title: "Assinaturas" };

const PAID: PlanTier[] = ["destaque", "ideal", "presenca"];

export default async function AdminAssinaturasPage() {
  const m = await getMetrics();
  const supabase = createAdminClient();

  const { data: subs } = await supabase
    .from("psychologists")
    .select("id, display_name, slug, plan_tier, subscription_status, subscription_period_end, profile_id")
    .in("plan_tier", PAID)
    .order("subscription_status", { ascending: true });

  const { count: emTesteCount } = await supabase
    .from("psychologists")
    .select("id", { count: "exact", head: true })
    .gt("trial_ends_at", new Date().toISOString());
  const emTeste = emTesteCount ?? 0;

  const rows = (subs as {
    id: string; display_name: string | null; slug: string | null;
    plan_tier: PlanTier; subscription_status: SubscriptionStatus; subscription_period_end: string | null;
  }[]) ?? [];

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

      {/* Lista de assinantes pagos */}
      <section className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg">Planos pagos ({rows.length})</h2>
        </div>
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-foreground-muted">
            Nenhum psicólogo em plano pago ainda.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const s = SUBSCRIPTION_LABELS[r.subscription_status];
              return (
                <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div>
                    {r.slug ? (
                      <Link href={`/psicologo/${r.slug}`} target="_blank" className="font-medium text-heading hover:text-brand-dark">
                        {r.display_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-heading">{r.display_name}</span>
                    )}
                    <p className="text-xs text-foreground-muted">{PLAN_LABEL[r.plan_tier]}</p>
                  </div>
                  <Badge tone={s.tone}>{s.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {m.assinaturas.mrrCents === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-foreground-muted">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          A cobrança recorrente ativa quando o Asaas for configurado (variáveis
          <code className="mx-1">ASAAS_API_KEY</code>). Por ora os planos pagos são atribuídos em modo de teste.
        </div>
      )}
    </div>
  );
}

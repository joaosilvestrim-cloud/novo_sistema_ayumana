import Link from "next/link";
import { AlertCircle, CheckCircle2, Radio, Clock, XCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAsaasConfigured, asaasEnv } from "@/lib/payments/asaas";
import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier } from "@/lib/types";
import { IntegrationTester } from "./integration-tester";

export const metadata = { title: "Integrações" };
export const dynamic = "force-dynamic";

function Row({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) {
  return (
    <div className="flex items-start gap-2 border-b border-border py-3 last:border-0">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
      )}
      <div>
        <p className="text-sm text-heading">{label}</p>
        {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
      </div>
    </div>
  );
}

type Evento = {
  id: string;
  event: string;
  handled: boolean;
  note: string | null;
  psychologist_id: string | null;
  created_at: string;
};

/** Fica fora do componente porque a renderização precisa ser previsível. */
function diasDesde(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86_400_000);
}

type Aguardando = {
  id: string;
  display_name: string | null;
  profile_id: string;
  pending_plan_tier: PlanTier;
  pending_since: string | null;
};

export default async function IntegracoesPage() {
  await requireAdmin();
  const configured = isAsaasConfigured();
  const env = asaasEnv();
  const hasWebhookToken = !!process.env.ASAAS_WEBHOOK_TOKEN;

  const admin = createAdminClient();

  const { data: eventosRaw } = await admin
    .from("payment_events")
    .select("id, event, handled, note, psychologist_id, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  const eventos = (eventosRaw as Evento[] | null) ?? [];
  const naoTratados = eventos.filter((e) => !e.handled).length;

  const { data: pendRaw } = await admin
    .from("psychologists")
    .select("id, display_name, profile_id, pending_plan_tier, pending_since")
    .not("pending_plan_tier", "is", null)
    .order("pending_since", { ascending: true });
  const aguardando = ((pendRaw as Aguardando[] | null) ?? []).map((a) => ({
    ...a,
    dias: diasDesde(a.pending_since),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Integrações</h1>
        <p className="mt-1 text-foreground-muted">
          Diagnóstico da cobrança recorrente. Os dois testes abaixo não movimentam dinheiro.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Configuração desta implantação</h2>
        <div className="mt-3">
          <Row label="ASAAS_API_KEY definida" ok={configured} hint={configured ? undefined : "Cadastre na Vercel (Production) e faça Redeploy."} />
          <Row label={`Ambiente: ${env}`} ok={true} hint={env === "sandbox" ? "Modo de testes: nenhuma cobrança real." : "Produção: cobranças reais."} />
          <Row label="ASAAS_WEBHOOK_TOKEN definida" ok={hasWebhookToken} hint={hasWebhookToken ? undefined : "Precisa ser o mesmo token do webhook no Asaas."} />
          <Row
            label={eventos.length ? `Webhook já recebeu ${eventos.length} evento(s)` : "Webhook ainda não recebeu nenhum evento"}
            ok={eventos.length > 0}
            hint={eventos.length ? undefined : "Nenhuma notificação do Asaas chegou até agora."}
          />
        </div>
      </section>

      <IntegrationTester />

      {/* Quem clicou em assinar e ainda não pagou */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-yellow-600" /> Esperando pagamento
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-foreground-muted">
            {aguardando.length}
          </span>
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Assinaram no site e a cobrança foi emitida, mas o pagamento não confirmou.
          Enquanto estiverem aqui, continuam no plano anterior.
        </p>
        {aguardando.length === 0 ? (
          <p className="mt-4 rounded-lg bg-surface-muted px-3 py-6 text-center text-sm text-foreground-muted">
            Ninguém pendente.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {aguardando.map(({ dias, ...a }) => {
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <Link href={`/admin/usuarios/${a.profile_id}`} className="font-medium text-heading hover:underline">
                      {a.display_name || "—"}
                    </Link>
                    <p className="text-xs text-foreground-muted">
                      Quer o plano {PLAN_LABEL[a.pending_plan_tier]}
                      {a.pending_since && ` · há ${dias} dia(s)`}
                    </p>
                  </div>
                  {dias >= 3 && (
                    <span className="rounded-md bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      cobrar
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* O que o Asaas mandou */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 text-lg">
          <Radio className="h-5 w-5 text-brand-dark" /> Últimos avisos do Asaas
          {naoTratados > 0 && (
            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
              {naoTratados} sem tratar
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Cada linha é uma notificação que chegou no nosso servidor. É aqui que se vê
          a confirmação de pagamento entrando.
        </p>

        {eventos.length === 0 ? (
          <p className="mt-4 rounded-lg bg-surface-muted px-3 py-6 text-center text-sm text-foreground-muted">
            Nenhum evento recebido ainda.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
                  <th className="py-2 pr-3 font-medium">Quando</th>
                  <th className="py-2 pr-3 font-medium">Evento</th>
                  <th className="py-2 pr-3 font-medium">O que fizemos</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 align-top">
                    <td className="whitespace-nowrap py-2 pr-3 text-foreground-muted">
                      {new Date(e.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs text-heading">{e.event}</td>
                    <td className="py-2 pr-3 text-foreground-muted">{e.note || "—"}</td>
                    <td className="py-2">
                      {e.handled ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aplicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger">
                          <XCircle className="h-3.5 w-3.5" /> Sem efeito
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface-muted/50 p-5">
        <h2 className="text-base font-semibold text-heading">Teste completo sem gastar</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground-muted">
          <li>Rode os dois testes acima (custo zero).</li>
          <li>No painel de um psicólogo de teste, assine um plano pago. Isso cria a cobrança no Asaas, mas <strong>não paga nada</strong>. A pessoa aparece em &quot;Esperando pagamento&quot; e o plano dela <strong>não muda</strong>.</li>
          <li>Confirme no Asaas que a cobrança foi gerada e depois <strong>cancele a assinatura</strong>. Cobrança emitida e não paga não gera custo.</li>
          <li>Para validar a confirmação ponta a ponta, pague uma cobrança de verdade e observe o evento <code>PAYMENT_CONFIRMED</code> aparecer na tabela acima. Depois estorne no Asaas.</li>
        </ol>
      </section>
    </div>
  );
}

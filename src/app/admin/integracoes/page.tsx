import { AlertCircle, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isAsaasConfigured, asaasEnv } from "@/lib/payments/asaas";
import { IntegrationTester } from "./integration-tester";

export const metadata = { title: "Integrações" };
export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  await requireAdmin();
  const configured = isAsaasConfigured();
  const env = asaasEnv();
  const hasWebhookToken = !!process.env.ASAAS_WEBHOOK_TOKEN;

  const Row = ({ label, ok, hint }: { label: string; ok: boolean; hint?: string }) => (
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
        </div>
      </section>

      <IntegrationTester />

      <section className="rounded-2xl border border-border bg-surface-muted/50 p-5">
        <h2 className="text-base font-semibold text-heading">Teste completo sem gastar</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-foreground-muted">
          <li>Rode os dois testes acima (custo zero).</li>
          <li>No painel de um psicólogo de teste, assine um plano pago. Isso cria a cobrança no Asaas, mas <strong>não paga nada</strong>.</li>
          <li>Confirme no Asaas que a cobrança foi gerada e depois <strong>cancele a assinatura</strong>. Cobrança emitida e não paga não gera custo.</li>
          <li>Só pague de verdade quando quiser validar o webhook de pagamento confirmado ponta a ponta.</li>
        </ol>
      </section>
    </div>
  );
}

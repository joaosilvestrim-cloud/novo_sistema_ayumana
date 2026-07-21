"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, XCircle, Loader2, Plug, Webhook } from "lucide-react";
import { testConnectionAction, testWebhookAction, type TestState } from "./actions";

const initial: TestState = { ok: null, message: "" };

function Btn({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function Result({ state }: { state: TestState }) {
  if (state.ok === null) return null;
  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
        state.ok ? "border-green-200 bg-green-50 text-green-800" : "border-danger/30 bg-danger/10 text-danger"
      }`}
    >
      {state.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <span className="break-all">{state.message}</span>
    </div>
  );
}

export function IntegrationTester() {
  const [conn, connAction] = useActionState(testConnectionAction, initial);
  const [hook, hookAction] = useActionState(testWebhookAction, initial);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 text-lg">
          <Plug className="h-5 w-5 text-teal-600" /> 1. Conexão com o Asaas
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Faz uma chamada <strong>só de leitura</strong> na sua conta. Não cria cliente,
          não gera cobrança, não custa nada.
        </p>
        <form action={connAction} className="mt-4">
          <Btn>Testar conexão</Btn>
        </form>
        <Result state={conn} />
      </section>

      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 text-lg">
          <Webhook className="h-5 w-5 text-teal-600" /> 2. Webhook
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Envia um evento de teste para a nossa própria URL, com o token do ambiente.
          Confirma que a URL responde e que o token bate. <strong>Nenhum plano é alterado.</strong>
        </p>
        <form action={hookAction} className="mt-4">
          <Btn>Testar webhook</Btn>
        </form>
        <Result state={hook} />
      </section>
    </div>
  );
}

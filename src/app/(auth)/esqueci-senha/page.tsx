"use client";

import { useActionState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestResetAction, type ResetState } from "./actions";

const initial: ResetState = { done: false };

function EsqueciSenhaForm() {
  const params = useSearchParams();
  const expirado = params.get("erro") === "expirado";
  // Vindo da campanha, o link traz o e-mail (e-mail) ou só a marca de origem
  // (WhatsApp, onde não dá para pré-preencher). Nos dois casos, recebe a pessoa
  // de forma acolhedora, não como "esqueci a senha", porque ela foi convidada.
  const emailInicial = params.get("email") ?? "";
  const daCampanha = !!emailInicial || !!params.get("origem") || (params.get("utm_source") ?? "").length > 0;

  // Registra o acesso à campanha por canal (email/whatsapp/direto), uma vez por
  // sessão. Alimenta o painel de reativação no admin. Toda a campanha (e-mail e
  // WhatsApp) direciona para cá, então é o ponto certo de medir.
  useEffect(() => {
    try {
      const key = "ayu_camp_" + new Date().toISOString().slice(0, 10);
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* segue */
    }
    const utm = (params.get("utm_source") || "").toLowerCase();
    const origem = (params.get("origem") || "").toLowerCase();
    // Honra a tag explícita. Assim WhatsApp, e-mail e qualquer canal novo caem no
    // bucket certo, em vez de tudo virar "direto".
    let canal = "direto";
    if (origem === "whatsapp" || origem === "wa" || origem === "zap") canal = "whatsapp";
    else if (origem === "email" || origem === "e-mail" || utm.includes("sendpulse") || utm.includes("email")) canal = "email";
    else if (origem) canal = origem.slice(0, 20);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "campaign", label: canal, path: "/esqueci-senha" }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [state, action] = useActionState(requestResetAction, initial);

  if (state.done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <h1 className="mt-3 text-2xl">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Se houver uma conta com esse e-mail, enviamos um link para criar uma
          nova senha. Confira também a caixa de spam.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-dark hover:underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl">{daCampanha ? "Acesse a sua conta" : "Esqueci minha senha"}</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        {daCampanha
          ? "Confirme o seu e-mail e enviaremos um link para você entrar e completar o perfil. Não precisa lembrar a senha antiga."
          : "Informe seu e-mail e enviaremos um link para criar uma nova senha."}
      </p>

      {expirado && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          O link anterior já tinha sido usado ou expirou. Peça um novo aqui embaixo.
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={emailInicial} />
        </Field>
        <SubmitButton className="w-full">{daCampanha ? "Receber link de acesso" : "Enviar link"}</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/login" className="font-medium text-brand-dark hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <Suspense>
      <EsqueciSenhaForm />
    </Suspense>
  );
}

"use client";

import { useActionState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { joinPresencaWaitlistAction, type WaitlistState } from "@/app/para-psicologos/actions";

const initial: WaitlistState = { ok: false, error: null };

export function PresencaWaitlist({ logado }: { logado?: boolean }) {
  const [state, action] = useActionState(joinPresencaWaitlistAction, initial);

  if (state.ok) {
    return (
      <div id="fila-presenca" className="rounded-2xl border border-brand/40 bg-brand/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
        <h3 className="mt-3 text-xl">{state.jaInscrito ? "Você já está na fila!" : "Inscrição recebida!"}</h3>
        <p className="mt-2 text-sm text-foreground-muted">
          A equipe da Ayumana entra em contato assim que abrir uma vaga do Presença. Enquanto isso, mantenha seu perfil completo.
        </p>
      </div>
    );
  }

  return (
    <div id="fila-presenca" className="rounded-2xl border border-border bg-background p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-dark" />
        <h3 className="text-xl">Entrar na fila do Presença</h3>
      </div>
      <p className="mt-1 text-sm text-foreground-muted">
        O Presença tem vagas limitadas (15 a 20). Deixe seus dados que a equipe chama você assim que abrir vaga.
        {logado && " Como você já tem conta, é só confirmar."}
      </p>

      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={logado ? "Nome (confirme ou ajuste)" : "Seu nome"} htmlFor="pw_name">
          <Input id="pw_name" name="name" required={!logado} />
        </Field>
        <Field label={logado ? "E-mail (confirme)" : "Seu e-mail"} htmlFor="pw_email">
          <Input id="pw_email" name="email" type="email" required={!logado} />
        </Field>
        <Field label="WhatsApp" htmlFor="pw_phone">
          <Input id="pw_phone" name="phone" inputMode="tel" placeholder="+55 11 90000-0000" />
        </Field>
        <Field label="Conte um pouco sobre você (opcional)" htmlFor="pw_note" className="sm:col-span-2">
          <Textarea id="pw_note" name="note" rows={3} placeholder="Onde atende, público, por que quer o Presença…" />
        </Field>
        {state.error && <p className="sm:col-span-2 text-sm text-danger">{state.error}</p>}
        <div className="sm:col-span-2">
          <SubmitButton>Entrar na fila</SubmitButton>
        </div>
      </form>
    </div>
  );
}

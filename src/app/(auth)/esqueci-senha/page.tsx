"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestResetAction, type ResetState } from "./actions";

const initial: ResetState = { done: false };

export default function EsqueciSenhaPage() {
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
      <h1 className="text-2xl">Esqueci minha senha</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <SubmitButton className="w-full">Enviar link</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/login" className="font-medium text-brand-dark hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

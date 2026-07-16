"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthState } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthState = { error: null };

export default function CadastroPage() {
  const [state, action] = useActionState(signUpAction, initial);

  return (
    <div>
      <h1 className="text-2xl">Criar perfil de psicólogo</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        É grátis. Depois você verifica seu CRP e aparece na busca.
      </p>

      <form action={action} className="mt-6 space-y-4">
        <Field label="Nome completo" htmlFor="full_name">
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </Field>
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field
          label="Senha"
          htmlFor="password"
          hint="Mínimo de 8 caracteres."
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <SubmitButton className="w-full">Criar conta grátis</SubmitButton>
      </form>

      <p className="mt-4 text-center text-xs text-foreground-muted">
        Ao criar a conta você concorda com os{" "}
        <Link href="/termos" className="underline">termos</Link> e a{" "}
        <Link href="/privacidade" className="underline">política de privacidade</Link>.
      </p>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-brand-dark hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

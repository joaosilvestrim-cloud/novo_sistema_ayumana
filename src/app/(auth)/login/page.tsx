"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction, type AuthState } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthState = { error: null };

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/painel";
  const confirmar = params.get("confirme");
  const [state, action] = useActionState(signInAction, initial);

  return (
    <div>
      <h1 className="text-2xl">Entrar</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Acesse o painel do seu perfil profissional.
      </p>

      {confirmar && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-700">
          Enviamos um e-mail de confirmação. Confirme sua conta e faça login.
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Senha" htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </Field>

        {state.error && (
          <p className="text-sm text-danger">{state.error}</p>
        )}

        <div className="text-right">
          <Link href="/esqueci-senha" className="text-sm text-foreground-muted hover:text-brand-dark">
            Esqueci minha senha
          </Link>
        </div>

        <SubmitButton className="w-full">Entrar</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Ainda não tem perfil?{" "}
        <Link href="/cadastro" className="font-medium text-brand-dark hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

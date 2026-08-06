"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePasswordAction, type AuthState } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthState = { error: null };

export default function RedefinirSenhaPage() {
  const [state, action] = useActionState(updatePasswordAction, initial);

  return (
    <div>
      <h1 className="text-2xl">Criar nova senha</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Defina uma senha para acessar seu painel.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres.">
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
        <SubmitButton className="w-full">Salvar senha</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-foreground-muted">
        <Link href="/esqueci-senha" className="font-medium text-brand-dark hover:underline">
          Pedir um novo link
        </Link>
      </p>
    </div>
  );
}

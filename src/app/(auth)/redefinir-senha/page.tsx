"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { updatePasswordAction, type AuthState } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthState = { error: null };

export default function RedefinirSenhaPage() {
  const [state, action] = useActionState(updatePasswordAction, initial);
  const [showPw, setShowPw] = useState(false);

  return (
    <div>
      <h1 className="text-2xl">Criar nova senha</h1>
      <p className="mt-1 text-sm text-foreground-muted">
        Defina uma senha para acessar seu painel.
      </p>
      <form action={action} className="mt-6 space-y-4">
        <Field label="Nova senha" htmlFor="password" hint="Mínimo de 8 caracteres.">
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-heading"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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

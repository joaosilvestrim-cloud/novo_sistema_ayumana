"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, UserPlus } from "lucide-react";
import { Field, Input, Select, Label } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createUserAction, type CreateUserState } from "./actions";

const initial: CreateUserState = { error: null };

export function NewUserForm() {
  const [state, action] = useActionState(createUserAction, initial);
  const [mode, setMode] = useState<"senha" | "convite">("senha");

  return (
    <form action={action} className="max-w-lg space-y-4 rounded-2xl border border-border bg-background p-6">
      {state.ok && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Usuário <strong>{state.email}</strong> criado com sucesso.
        </div>
      )}

      <Field label="Nome completo" htmlFor="full_name">
        <Input id="full_name" name="full_name" required />
      </Field>

      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" required />
      </Field>

      <Field label="Papel" htmlFor="role">
        <Select id="role" name="role" defaultValue="admin">
          <option value="admin">Admin (acesso ao painel)</option>
          <option value="psicologo">Psicólogo</option>
        </Select>
      </Field>

      <div>
        <Label>Como definir o acesso</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("senha")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === "senha" ? "border-brand bg-brand/10 text-brand-dark" : "border-border text-foreground-muted"}`}
          >
            Definir senha agora
          </button>
          <button
            type="button"
            onClick={() => setMode("convite")}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${mode === "convite" ? "border-brand bg-brand/10 text-brand-dark" : "border-border text-foreground-muted"}`}
          >
            Enviar convite por e-mail
          </button>
        </div>
      </div>

      <input type="hidden" name="mode" value={mode} />

      {mode === "senha" ? (
        <Field label="Senha" htmlFor="password" hint="Mínimo de 8 caracteres. A pessoa pode trocar depois.">
          <Input id="password" name="password" type="text" minLength={8} autoComplete="new-password" />
        </Field>
      ) : (
        <p className="rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground-muted">
          Um e-mail de convite será enviado para a pessoa definir a própria senha.
          Requer SMTP configurado no Supabase.
        </p>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex items-center gap-3">
        <SubmitButton>
          <UserPlus className="h-4 w-4" /> Criar usuário
        </SubmitButton>
        <Link href="/admin/usuarios" className="text-sm text-foreground-muted hover:text-brand-dark">
          Voltar para a lista
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { COUNTRIES, type Specialty } from "@/lib/types";
import { askQuestionAction, type AskState } from "./actions";

const initial: AskState = { error: null };

export function AskForm({ specialties }: { specialties: Specialty[] }) {
  const [state, action] = useActionState(askQuestionAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
        <p className="mt-2 font-medium text-green-800">Pergunta enviada!</p>
        <p className="mt-1 text-sm text-green-700">
          Ela passa por moderação antes de ser publicada. Obrigado por participar.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-background p-6">
      <div>
        <h2 className="text-lg">Faça uma pergunta anônima</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Psicólogos verificados respondem. Não compartilhe dados que te
          identifiquem.
        </p>
      </div>

      <Field label="Sua pergunta" htmlFor="title">
        <Input id="title" name="title" placeholder="Ex.: Como lidar com a saudade morando fora?" required />
      </Field>

      <Field label="Contexto (opcional)" htmlFor="body">
        <Textarea id="body" name="body" rows={4} placeholder="Conte um pouco mais, se quiser." />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Apelido" htmlFor="author_alias">
          <Input id="author_alias" name="author_alias" placeholder="Anônimo" />
        </Field>
        <Field label="Tema" htmlFor="specialty_id">
          <Select id="specialty_id" name="specialty_id" defaultValue="">
            <option value="">Geral</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Vive em" htmlFor="country_code">
          <Select id="country_code" name="country_code" defaultValue="">
            <option value="">Brasil / outro</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </Select>
        </Field>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <SubmitButton>Enviar pergunta</SubmitButton>
    </form>
  );
}

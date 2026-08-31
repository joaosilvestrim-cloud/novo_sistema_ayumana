"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createLeadAction, type LeadState } from "@/app/comunidades/lead-actions";
import { COUNTRIES } from "@/lib/types";

const initial: LeadState = { ok: false };

export function CommunityLeadForm({ sourceSlug }: { sourceSlug?: string }) {
  const [state, action] = useActionState(createLeadAction, initial);

  if (state.ok) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Recebemos o seu contato.</p>
          <p className="mt-1">Nossa equipe vai te chamar para desenhar uma ação sob medida para a sua comunidade.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-background p-6">
      <p className="text-sm font-semibold text-heading">Quero levar a Ayumana para a minha comunidade</p>
      {sourceSlug && <input type="hidden" name="source_slug" value={sourceSlug} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seu nome" htmlFor="contact_name">
          <Input id="contact_name" name="contact_name" autoComplete="name" />
        </Field>
        <Field label="Seu e-mail" htmlFor="contact_email">
          <Input id="contact_email" name="contact_email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Nome da comunidade" htmlFor="community_name">
          <Input id="community_name" name="community_name" />
        </Field>
        <Field label="País" htmlFor="country_code">
          <Select id="country_code" name="country_code" defaultValue="">
            <option value="">Selecione</option>
            {COUNTRIES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Conte um pouco sobre a comunidade" htmlFor="message">
        <textarea id="message" name="message" className="min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand" placeholder="Tamanho, país, temas que mais tocam os membros..." />
      </Field>
      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-danger"><AlertCircle className="h-4 w-4" /> {state.error}</p>
      )}
      <SubmitButton>Enviar</SubmitButton>
      <p className="text-xs text-foreground-muted">Sem compromisso. A conversa é sobre como cuidar da saúde emocional dos seus membros.</p>
    </form>
  );
}

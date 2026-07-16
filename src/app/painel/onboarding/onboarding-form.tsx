"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Field, Input, Textarea, Select, Label } from "@/components/ui/field";
import {
  AUDIENCE_LABELS,
  COUNTRIES,
  type Approach,
  type Audience,
  type Psychologist,
  type Specialty,
} from "@/lib/types";
import { saveOnboardingAction, type OnboardingState } from "./actions";

const initial: OnboardingState = { error: null };
const AUDIENCES = Object.keys(AUDIENCE_LABELS) as Audience[];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <h2 className="text-lg">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function CheckPill({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/10 has-[:checked]:text-brand-dark">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-3.5 w-3.5 accent-[var(--ayu-verde)]"
      />
      {label}
    </label>
  );
}

function Actions() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="submit"
        name="intent"
        value="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar para verificação
      </button>
      <button
        type="submit"
        name="intent"
        value="save"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm font-medium text-heading transition-colors hover:bg-surface-muted disabled:opacity-50"
      >
        Salvar rascunho
      </button>
    </div>
  );
}

export function OnboardingForm({
  psy,
  approaches,
  specialties,
  selectedApproaches,
  selectedSpecialties,
  selectedCountries,
}: {
  psy: Psychologist | null;
  approaches: Approach[];
  specialties: Specialty[];
  selectedApproaches: number[];
  selectedSpecialties: number[];
  selectedCountries: string[];
}) {
  const [state, action] = useActionState(saveOnboardingAction, initial);
  const [abroad, setAbroad] = useState(psy?.attends_abroad ?? false);

  const geral = specialties.filter((s) => s.category !== "exterior");
  const exterior = specialties.filter((s) => s.category === "exterior");

  return (
    <form action={action} className="space-y-6">
      {state.ok && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Rascunho salvo.
        </div>
      )}

      <Section title="Dados básicos">
        <Field label="Nome de exibição" htmlFor="display_name" hint="Como você aparece no perfil público.">
          <Input id="display_name" name="display_name" defaultValue={psy?.display_name ?? ""} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Gênero" htmlFor="gender">
            <Select id="gender" name="gender" defaultValue={psy?.gender ?? ""}>
              <option value="">Prefiro não informar</option>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="nao_binario">Não-binário</option>
              <option value="outro">Outro</option>
            </Select>
          </Field>
          <Field label="WhatsApp" htmlFor="phone_whatsapp" hint="Com DDI/DDD. Ex.: 5511999998888">
            <Input id="phone_whatsapp" name="phone_whatsapp" inputMode="tel" defaultValue={psy?.phone_whatsapp ?? ""} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cidade base" htmlFor="city">
            <Input id="city" name="city" defaultValue={psy?.city ?? ""} />
          </Field>
          <Field label="Estado (UF)" htmlFor="state">
            <Input id="state" name="state" maxLength={2} defaultValue={psy?.state ?? ""} />
          </Field>
        </div>
      </Section>

      <Section title="Registro profissional (CRP)" description="Obrigatório para verificação. Seu documento é privado e visto apenas pela equipe Ayumana.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Número do CRP" htmlFor="crp_number" hint="Ex.: 06/123456">
            <Input id="crp_number" name="crp_number" defaultValue={psy?.crp_number ?? ""} />
          </Field>
          <Field label="UF do CRP" htmlFor="crp_uf" hint="Ex.: SP">
            <Input id="crp_uf" name="crp_uf" maxLength={2} defaultValue={psy?.crp_uf ?? ""} />
          </Field>
        </div>
        <Field
          label="Documento do CRP"
          htmlFor="crp_document"
          hint={
            psy?.crp_document_path
              ? "Um documento já foi enviado. Envie outro para substituir."
              : "PDF ou imagem (carteira/e-Psi), até 10 MB."
          }
        >
          <Input id="crp_document" name="crp_document" type="file" accept=".pdf,image/*" className="file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:text-heading" />
        </Field>
      </Section>

      <Section title="Apresentação">
        <Field label="Título do perfil" htmlFor="headline" hint="Uma frase. Ex.: Psicóloga clínica para brasileiros na Europa.">
          <Input id="headline" name="headline" defaultValue={psy?.headline ?? ""} />
        </Field>
        <Field label="Sobre você" htmlFor="bio" hint="Fale da sua abordagem e de quem você atende.">
          <Textarea id="bio" name="bio" rows={6} defaultValue={psy?.bio ?? ""} />
        </Field>
      </Section>

      <Section title="Abordagens">
        <div className="flex flex-wrap gap-2">
          {approaches.map((a) => (
            <CheckPill
              key={a.id}
              name="approaches"
              value={String(a.id)}
              label={a.name}
              defaultChecked={selectedApproaches.includes(a.id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Temas e queixas atendidas">
        <div>
          <Label>Gerais</Label>
          <div className="flex flex-wrap gap-2">
            {geral.map((s) => (
              <CheckPill key={s.id} name="specialties" value={String(s.id)} label={s.name} defaultChecked={selectedSpecialties.includes(s.id)} />
            ))}
          </div>
        </div>
        <div>
          <Label>Foco em quem vive no exterior</Label>
          <div className="flex flex-wrap gap-2">
            {exterior.map((s) => (
              <CheckPill key={s.id} name="specialties" value={String(s.id)} label={s.name} defaultChecked={selectedSpecialties.includes(s.id)} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Atendimento">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accepts_online" defaultChecked={psy?.accepts_online ?? true} className="h-4 w-4 accent-[var(--ayu-verde)]" />
            Atendimento online
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="accepts_in_person" defaultChecked={psy?.accepts_in_person ?? false} className="h-4 w-4 accent-[var(--ayu-verde)]" />
            Atendimento presencial
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="attends_abroad"
              checked={abroad}
              onChange={(e) => setAbroad(e.target.checked)}
              className="h-4 w-4 accent-[var(--ayu-verde)]"
            />
            Atendo brasileiros no exterior
          </label>
        </div>

        {abroad && (
          <Field label="Países que você atende">
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <CheckPill key={c.code} name="countries" value={c.code} label={c.name} defaultChecked={selectedCountries.includes(c.code)} />
              ))}
            </div>
          </Field>
        )}

        <Field label="Público atendido">
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map((a) => (
              <CheckPill key={a} name="audiences" value={a} label={AUDIENCE_LABELS[a]} defaultChecked={(psy?.audiences ?? ["adulto"]).includes(a)} />
            ))}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Idiomas" htmlFor="languages" hint="Separe por vírgula. Ex.: pt, en, es">
            <Input id="languages" name="languages" defaultValue={(psy?.languages ?? ["pt"]).join(", ")} />
          </Field>
          <Field label="Valor da sessão (R$)" htmlFor="session_price" hint="Opcional. Aparece nos planos pagos.">
            <Input id="session_price" name="session_price" inputMode="decimal" defaultValue={psy?.session_price_cents ? (psy.session_price_cents / 100).toFixed(2) : ""} />
          </Field>
        </div>

        <Field label="Fusos/janelas de horário" htmlFor="timezones" hint="Relevante para o exterior. Ex.: Europe/Lisbon, America/Sao_Paulo">
          <Input id="timezones" name="timezones" defaultValue={(psy?.timezones ?? []).join(", ")} />
        </Field>
      </Section>

      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <Actions />
    </form>
  );
}

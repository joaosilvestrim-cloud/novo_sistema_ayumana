"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import { Field, Input, Select, Label } from "@/components/ui/field";
import { COUNTRIES } from "@/lib/types";
import { COMMUNITY_TYPE_LABEL, COMMUNITY_THEMES, type Community } from "@/lib/communities-types";
import { saveCommunityAction } from "@/app/admin/comunidades/actions";

const STATUS: { v: string; label: string }[] = [
  { v: "prospect", label: "Prospecção" },
  { v: "negotiating", label: "Em negociação" },
  { v: "active", label: "Parceria ativa" },
  { v: "paused", label: "Pausada" },
  { v: "closed", label: "Encerrada" },
];

export function CommunityForm({ c, site }: { c: Community | null; site: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    setMsg(null);
    try {
      const res = await saveCommunityAction(fd);
      if (res.ok) {
        setMsg({ ok: true, text: "Comunidade salva." });
        if (!c && res.slug) {
          // Criou agora: recarrega para a tela de edição (via lista).
          router.push("/admin/comunidades");
          router.refresh();
        } else {
          router.refresh();
        }
      } else {
        setMsg({ ok: false, text: res.error || "Não foi possível salvar." });
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error)?.message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  const base = site.replace(/\/$/, "");

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {c && <input type="hidden" name="id" value={c.id} />}

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-800" : "border-danger/30 bg-danger/10 text-danger"}`}>
          {msg.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da comunidade" htmlFor="name" obrigatorio>
            <Input id="name" name="name" defaultValue={c?.name ?? ""} required />
          </Field>
          <Field label="Slug (URL)" htmlFor="slug" hint={`${base}/comunidades/SLUG. Deixe vazio para gerar do nome.`}>
            <Input id="slug" name="slug" defaultValue={c?.slug ?? ""} placeholder="abeu" />
          </Field>
          <Field label="País" htmlFor="country_code" obrigatorio>
            <Select id="country_code" name="country_code" defaultValue={c?.country_code ?? ""} required>
              <option value="">Selecione</option>
              {COUNTRIES.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Cidade / região" htmlFor="city_region">
            <Input id="city_region" name="city_region" defaultValue={c?.city_region ?? ""} />
          </Field>
          <Field label="Tipo" htmlFor="type">
            <Select id="type" name="type" defaultValue={c?.type ?? "associacao"}>
              {Object.entries(COMMUNITY_TYPE_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </Select>
          </Field>
          <Field label="Status da parceria" htmlFor="status">
            <Select id="status" name="status" defaultValue={c?.status ?? "prospect"}>
              {STATUS.map((x) => <option key={x.v} value={x.v}>{x.label}</option>)}
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <p className="text-sm font-semibold text-heading">Conteúdo da landing</p>
        <Field label="Título da landing (headline)" htmlFor="headline" hint="Ex.: Terapia em português para a comunidade brasileira na Irlanda.">
          <Input id="headline" name="headline" defaultValue={c?.headline ?? ""} />
        </Field>
        <Field label="Texto de apresentação" htmlFor="intro_text" hint="Explica a parceria em 2-3 frases.">
          <textarea id="intro_text" name="intro_text" defaultValue={c?.intro_text ?? ""} className="min-h-24 w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Logo do parceiro</Label>
            {c?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logo_url} alt="logo" className="mb-2 h-12 w-12 rounded-lg border border-border object-contain" />
            )}
            <input type="file" name="logo_file" accept="image/*" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:text-heading" />
            <Input name="logo_url" defaultValue={c?.logo_url ?? ""} placeholder="ou cole uma URL" className="mt-2" />
          </div>
          <div>
            <Label>Imagem de capa</Label>
            {c?.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.cover_image_url} alt="capa" className="mb-2 h-12 w-20 rounded-lg border border-border object-cover" />
            )}
            <input type="file" name="cover_file" accept="image/*" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:text-heading" />
            <Input name="cover_image_url" defaultValue={c?.cover_image_url ?? ""} placeholder="ou cole uma URL" className="mt-2" />
          </div>
        </div>

        <div>
          <Label>Temas dos encontros desta comunidade</Label>
          <p className="mb-2 text-xs text-foreground-muted">Aparecem na landing como atalhos de busca. Selecione os que fazem sentido.</p>
          <div className="flex flex-wrap gap-2">
            {COMMUNITY_THEMES.map((t) => (
              <label key={t} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand/10 has-[:checked]:text-brand-dark">
                <input type="checkbox" name="themes" value={t} defaultChecked={(c?.themes ?? []).includes(t)} className="h-3.5 w-3.5 accent-[var(--ayu-verde)]" />
                {t}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <p className="text-sm font-semibold text-heading">Contato do parceiro</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pessoa responsável" htmlFor="contact_name">
            <Input id="contact_name" name="contact_name" defaultValue={c?.contact_name ?? ""} />
          </Field>
          <Field label="E-mail institucional" htmlFor="contact_email">
            <Input id="contact_email" name="contact_email" type="email" defaultValue={c?.contact_email ?? ""} />
          </Field>
          <Field label="Site" htmlFor="website_url">
            <Input id="website_url" name="website_url" defaultValue={c?.website_url ?? ""} placeholder="https://..." />
          </Field>
          <Field label="Instagram" htmlFor="instagram_url">
            <Input id="instagram_url" name="instagram_url" defaultValue={c?.instagram_url ?? ""} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="Parceria desde" htmlFor="partner_since">
            <Input id="partner_since" name="partner_since" type="date" defaultValue={c?.partner_since ?? ""} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-background p-5">
        <p className="text-sm font-semibold text-heading">SEO e publicação</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título SEO" htmlFor="seo_title">
            <Input id="seo_title" name="seo_title" defaultValue={c?.seo_title ?? ""} />
          </Field>
          <Field label="Descrição SEO" htmlFor="seo_description">
            <Input id="seo_description" name="seo_description" defaultValue={c?.seo_description ?? ""} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_public" defaultChecked={c?.is_public ?? false} className="h-4 w-4 accent-[var(--ayu-verde)]" />
          Publicar a página (visível e indexável). Deixe desmarcado enquanto for rascunho ou prospecção.
        </label>
        {c?.is_public && (
          <Link href={`/comunidades/${c.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">
            <ExternalLink className="h-4 w-4" /> Ver página pública
          </Link>
        )}
      </section>

      {c && (
        <section className="rounded-2xl border border-border bg-surface-muted/40 p-5">
          <Label>Link rastreável para divulgar</Label>
          <p className="mt-1 break-all font-mono text-xs text-foreground-muted">
            {base}/comunidades/{c.slug}?utm_source={c.utm_source ?? c.slug}&utm_medium=community&utm_campaign=ayumana_comunidades
          </p>
          <p className="mt-1 text-xs text-foreground-muted">Todo acesso e clique no WhatsApp por essa página é atribuído a esta comunidade.</p>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : c ? "Salvar alterações" : "Criar comunidade"}
        </button>
        <Link href="/admin/comunidades" className="text-sm text-foreground-muted hover:text-heading">Voltar</Link>
      </div>
    </form>
  );
}

import { ClipboardList, Download, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  avaliarCompletude, OBRIGATORIOS, RECOMENDADOS, VANTAGENS_PERFIL_COMPLETO,
  type CompletudeInput,
} from "@/lib/profile-completeness";
import { CompletudeList } from "@/components/admin/completude-list";

export const metadata = { title: "Perfis incompletos" };

type Psy = CompletudeInput & { id: string; profile_id: string; slug: string | null; is_published: boolean | null };

export default async function AdminCompletudePage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: psysRaw }, { data: profs }, { data: apr }, { data: esp }] = await Promise.all([
    admin.from("psychologists").select(
      "id, profile_id, slug, display_name, crp_number, crp_uf, crp_document_path, headline, bio, avatar_url, city, phone_whatsapp, session_price_cents, video_url, is_published"
    ),
    admin.from("profiles").select("id, email"),
    admin.from("psychologist_approaches").select("psychologist_id"),
    admin.from("psychologist_specialties").select("psychologist_id"),
  ]);

  const emailPor = new Map<string, string>(((profs ?? []) as { id: string; email: string | null }[]).filter((p) => p.email).map((p) => [p.id, p.email as string]));
  const comApr = new Set(((apr ?? []) as { psychologist_id: string }[]).map((r) => r.psychologist_id));
  const comEsp = new Set(((esp ?? []) as { psychologist_id: string }[]).map((r) => r.psychologist_id));

  const psys = ((psysRaw ?? []) as Omit<Psy, "hasApproaches" | "hasSpecialties">[]).map((p) => ({
    ...p,
    hasApproaches: comApr.has(p.id),
    hasSpecialties: comEsp.has(p.id),
  })) as Psy[];

  const avaliados = psys
    .map((p) => ({ p, a: avaliarCompletude(p) }))
    .sort((x, y) => x.a.percent - y.a.percent);

  const incompletos = avaliados.filter((x) => !x.a.completo);
  const media = avaliados.length ? Math.round(avaliados.reduce((s, x) => s + x.a.percent, 0) / avaliados.length) : 0;

  // Lista serializável para o componente cliente com busca.
  const linhas = incompletos.map(({ p, a }) => ({
    profileId: p.profile_id,
    name: p.display_name || "—",
    email: emailPor.get(p.profile_id) || null,
    percent: a.percent,
    obrigatorio: a.faltaObrigatorio.map((c) => c.label),
    recomendado: a.faltaRecomendado.map((c) => c.label),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl"><ClipboardList className="h-6 w-6 text-brand-dark" /> Perfis incompletos</h1>
          <p className="mt-1 text-foreground-muted">O que falta em cada perfil, já pronto para você cobrar. Obrigatório trava a publicação; recomendado aumenta a visibilidade.</p>
        </div>
        <a href="/admin/completude/export" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-muted">
          <Download className="h-4 w-4" /> Exportar CSV
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-2xl font-semibold text-heading">{avaliados.length}</p>
          <p className="text-sm text-foreground-muted">Perfis no total</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-2xl font-semibold text-yellow-600">{incompletos.length}</p>
          <p className="text-sm text-foreground-muted">Com obrigatório faltando</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-2xl font-semibold text-heading">{media}%</p>
          <p className="text-sm text-foreground-muted">Completude média</p>
        </div>
      </div>

      {/* Legenda + vantagens */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">O que conta</h2>
          <p className="mt-1 text-sm font-medium text-yellow-700">Obrigatório (sem isso não publica):</p>
          <p className="text-sm text-foreground-muted">{OBRIGATORIOS.map((c) => c.label).join(", ")}.</p>
          <p className="mt-3 text-sm font-medium text-brand-dark">Recomendado (aumenta a visibilidade):</p>
          <p className="text-sm text-foreground-muted">{RECOMENDADOS.map((c) => c.label).join(", ")}.</p>
        </section>
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Vantagens de completar</h2>
          <ul className="mt-2 space-y-1.5">
            {VANTAGENS_PERFIL_COMPLETO.map((v) => (
              <li key={v} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {v}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Lista com busca */}
      <CompletudeList rows={linhas} />
    </div>
  );
}

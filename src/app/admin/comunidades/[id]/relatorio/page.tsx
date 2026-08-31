import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, UserRound, MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Community } from "@/lib/communities-types";

export const metadata = { title: "Relatório da comunidade" };

type Ev = { type: string; path: string | null; label: string | null; utm_source: string | null; visitor: string | null; created_at: string };

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-heading">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
}

export default async function RelatorioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("communities").select("*").eq("id", id).maybeSingle();
  const c = data as Community | null;
  if (!c) notFound();

  const { data: evRaw } = await admin
    .from("analytics_events")
    .select("type, path, label, utm_source, visitor, created_at")
    .eq("community", c.slug)
    .order("created_at", { ascending: false })
    .limit(10000);
  const ev = (evRaw as Ev[] | null) ?? [];

  const views = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/comunidades/")).length;
  const perfis = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/psicologo/")).length;
  const whats = ev.filter((e) => e.type === "click" && (e.label ?? "").includes("wa.me")).length;
  const buscas = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/psicologos")).length;
  const visitantes = new Set(ev.map((e) => e.visitor).filter(Boolean)).size;
  const conv = views > 0 ? Math.round((whats / views) * 100) : 0;

  // Perfis mais contatados a partir desta comunidade.
  const contatos: Record<string, number> = {};
  for (const e of ev) {
    if (e.type === "click" && (e.label ?? "").includes("wa.me") && (e.path ?? "").startsWith("/psicologo/")) {
      const slug = (e.path ?? "").slice("/psicologo/".length);
      contatos[slug] = (contatos[slug] ?? 0) + 1;
    }
  }
  const slugs = Object.keys(contatos).slice(0, 100);
  const nome: Record<string, string> = {};
  if (slugs.length) {
    const { data: ps } = await admin.from("psychologists").select("slug, display_name").in("slug", slugs);
    for (const p of (ps as { slug: string; display_name: string | null }[] | null) ?? []) nome[p.slug] = p.display_name ?? p.slug;
  }
  const topContatos = Object.entries(contatos).map(([s, n]) => ({ nome: nome[s] ?? s, n })).sort((a, b) => b.n - a.n).slice(0, 10);

  // Origem (utm_source) dos acessos.
  const origens: Record<string, number> = {};
  for (const e of ev) {
    const o = e.utm_source || "sem marcação";
    origens[o] = (origens[o] ?? 0) + 1;
  }
  const topOrigens = Object.entries(origens).map(([o, n]) => ({ o, n })).sort((a, b) => b.n - a.n).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/admin/comunidades/${c.id}`} className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
            <ArrowLeft className="h-4 w-4" /> {c.name}
          </Link>
          <h1 className="mt-2 text-2xl">Relatório · {c.name}</h1>
          <p className="mt-1 text-foreground-muted">Funil completo atribuído a esta comunidade. Ideal para enviar ao parceiro após 30 dias.</p>
        </div>
        <a href={`/admin/comunidades/${c.id}/relatorio/export`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-heading hover:bg-surface-muted">
          <Download className="h-4 w-4" /> Exportar CSV
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Eye className="h-5 w-5" />} label="Visitas à página" value={views} sub={`${visitantes} visitantes diferentes`} />
        <Stat icon={<UserRound className="h-5 w-5" />} label="Buscas de psicólogo" value={buscas} />
        <Stat icon={<UserRound className="h-5 w-5" />} label="Perfis abertos" value={perfis} />
        <Stat icon={<MessageCircle className="h-5 w-5" />} label="Contatos no WhatsApp" value={whats} sub={`${conv}% de conversão`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Psicólogos mais contatados</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">Quem recebeu mais cliques de WhatsApp vindos desta comunidade.</p>
          {topContatos.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-muted">Ainda sem contatos.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {topContatos.map((t) => (
                <li key={t.nome} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-foreground">{t.nome}</span>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{t.n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Origem dos acessos (UTM)</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">De onde vieram, quando o link estava marcado.</p>
          <ul className="mt-4 space-y-2">
            {topOrigens.map((o) => (
              <li key={o.o} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{o.o}</span>
                <span className="shrink-0 text-foreground-muted">{o.n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Eye, UserRound, MessageCircle, CalendarClock, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/types";
import type { Community, CommunityEvent } from "@/lib/communities-types";

export const metadata = { title: "Relatório da comunidade" };
const paisNome = (code: string) => COUNTRIES.find((p) => p.code === code)?.name ?? code;

type Ev = { type: string; path: string | null; label: string | null; visitor: string | null };

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

export default async function ParceiroRelatorio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: cData } = await admin.from("communities").select("*").eq("slug", slug).maybeSingle();
  const c = cData as Community | null;
  if (!c) notFound();

  // Só quem é responsável desta comunidade pode ver.
  const { data: mem } = await admin.from("community_managers").select("profile_id").eq("community_id", c.id).eq("profile_id", user.id).maybeSingle();
  if (!mem) notFound();

  const [{ data: evRaw }, { data: evData }] = await Promise.all([
    admin.from("analytics_events").select("type, path, label, visitor").eq("community", c.slug).limit(20000),
    admin.from("community_events").select("*").eq("community_id", c.id).order("starts_at", { ascending: true, nullsFirst: false }),
  ]);
  const ev = (evRaw as Ev[] | null) ?? [];
  const eventos = ((evData as CommunityEvent[] | null) ?? []).filter((e) => e.status === "proximo");

  const views = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/comunidades/")).length;
  const buscas = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/psicologos")).length;
  const perfis = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/psicologo/")).length;
  const whats = ev.filter((e) => e.type === "click" && (e.label ?? "").includes("wa.me")).length;
  const visitantes = new Set(ev.map((e) => e.visitor).filter(Boolean)).size;
  const conv = views > 0 ? Math.round((whats / views) * 100) : 0;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";
  const link = `${site.replace(/\/$/, "")}/comunidades/${c.slug}?utm_source=${c.utm_source ?? c.slug}&utm_medium=community&utm_campaign=ayumana_comunidades`;
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "Data a confirmar");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/parceiro" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
          <ArrowLeft className="h-4 w-4" /> Minhas comunidades
        </Link>
        <h1 className="mt-2 text-2xl">{c.name}</h1>
        <p className="mt-1 text-foreground-muted">{paisNome(c.country_code)}{c.city_region ? ` · ${c.city_region}` : ""}. Números dos últimos meses.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Eye className="h-5 w-5" />} label="Visitas à página" value={views} sub={`${visitantes} pessoas diferentes`} />
        <Stat icon={<UserRound className="h-5 w-5" />} label="Buscas de psicólogo" value={buscas} />
        <Stat icon={<UserRound className="h-5 w-5" />} label="Perfis abertos" value={perfis} />
        <Stat icon={<MessageCircle className="h-5 w-5" />} label="Conversas no WhatsApp" value={whats} sub={`${conv}% de quem visitou`} />
      </div>

      {/* Link para divulgar */}
      <section className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
        <h2 className="text-lg">Link da sua comunidade</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">Compartilhe este link com os membros. Tudo que acontece por ele aparece aqui.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="break-all rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground-muted">{link}</p>
          <Link href={`/comunidades/${c.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">
            Abrir página <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Próximos encontros */}
      {eventos.length > 0 && (
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Próximos encontros</h2>
          <ul className="mt-4 space-y-3">
            {eventos.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium text-heading">{e.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-sm text-brand-dark"><CalendarClock className="h-4 w-4" /> {fmt(e.starts_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-foreground-muted">
        Este painel é só de leitura. Para mudar textos, logo, eventos ou os psicólogos em destaque, fale com a equipe da Ayumana.
      </p>
    </div>
  );
}

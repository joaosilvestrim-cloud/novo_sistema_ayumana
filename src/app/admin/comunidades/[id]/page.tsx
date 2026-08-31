import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommunityForm } from "@/components/admin/community-form";
import { CommunityEventsManager } from "@/components/admin/community-events-manager";
import { CommunityPsychologistsPicker } from "@/components/admin/community-psychologists-picker";
import { CommunityManagerAccess } from "@/components/admin/community-manager-access";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { deleteCommunityAction } from "../actions";
import type { Community, CommunityEvent } from "@/lib/communities";

export const metadata = { title: "Editar comunidade" };

export default async function EditarComunidadePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("communities").select("*").eq("id", id).maybeSingle();
  const c = data as Community | null;
  if (!c) notFound();
  const { data: ev } = await admin.from("community_events").select("*").eq("community_id", id).order("starts_at", { ascending: true, nullsFirst: false });
  const eventos = (ev as CommunityEvent[] | null) ?? [];
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

  // Métricas do funil desta comunidade (atribuídas pelo slug).
  const cnt = async (b: PromiseLike<{ count: number | null }>) => (await b).count ?? 0;
  const AE = () => admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("community", c.slug);
  const [mViews, mPerfis, mWhats] = await Promise.all([
    cnt(AE().eq("type", "pageview").ilike("path", "/comunidades/%")),
    cnt(AE().eq("type", "pageview").ilike("path", "/psicologo/%")),
    cnt(AE().eq("type", "click").ilike("label", "%wa.me%")),
  ]);

  // Dados para a curadoria de psicólogos.
  const { data: allPsi } = await admin.from("psychologists").select("id, display_name, crp_number").eq("is_published", true).order("display_name");
  const all = ((allPsi as { id: string; display_name: string | null; crp_number: string | null }[] | null) ?? [])
    .map((p) => ({ id: p.id, name: p.display_name ?? "(sem nome)", crp: p.crp_number ?? null }));
  const { data: cur } = await admin.from("community_psychologists").select("psychologist_id").eq("community_id", id).order("sort_order");
  const currentIds = ((cur as { psychologist_id: string }[] | null) ?? []).map((r) => r.psychologist_id);

  // Responsáveis com acesso de leitura.
  const { data: mgrs } = await admin.from("community_managers").select("profile_id, profile:profiles(full_name, email)").eq("community_id", id);
  const managers = ((mgrs as { profile_id: string; profile: { full_name: string | null; email: string | null } | null }[] | null) ?? [])
    .map((m) => ({ profileId: m.profile_id, name: m.profile?.full_name ?? null, email: m.profile?.email ?? null }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/comunidades" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
            <ArrowLeft className="h-4 w-4" /> Comunidades
          </Link>
          <h1 className="mt-2 text-2xl">{c.name}</h1>
        </div>
        <form action={deleteCommunityAction}>
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton
            message={`Excluir a comunidade "${c.name}" e seus eventos? Esta ação não pode ser desfeita.`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger/40 px-3 text-sm font-medium text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </ConfirmButton>
        </form>
      </div>

      {/* Métricas do funil desta comunidade */}
      <section className="rounded-2xl border border-brand/30 bg-brand/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg">Funil desta comunidade</h2>
            <p className="mt-0.5 text-sm text-foreground-muted">Atribuído pela origem, desde que a pessoa chega pela página da comunidade até o clique no WhatsApp.</p>
          </div>
          <Link href={`/admin/comunidades/${c.id}/relatorio`} className="shrink-0 text-sm font-medium text-brand-dark hover:underline">Relatório completo →</Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div><p className="text-2xl font-semibold text-heading">{mViews}</p><p className="text-xs text-foreground-muted">visitas à página</p></div>
          <div><p className="text-2xl font-semibold text-heading">{mPerfis}</p><p className="text-xs text-foreground-muted">perfis abertos</p></div>
          <div><p className="text-2xl font-semibold text-brand-dark">{mWhats}</p><p className="text-xs text-foreground-muted">contatos no WhatsApp</p></div>
        </div>
      </section>

      <CommunityForm c={c} site={site} />

      <CommunityPsychologistsPicker communityId={c.id} all={all} currentIds={currentIds} />

      <CommunityManagerAccess communityId={c.id} managers={managers} />

      <CommunityEventsManager communityId={c.id} eventos={eventos} />
    </div>
  );
}

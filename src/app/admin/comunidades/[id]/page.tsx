import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommunityForm } from "@/components/admin/community-form";
import { CommunityEventsManager } from "@/components/admin/community-events-manager";
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

      <CommunityForm c={c} site={site} />

      <CommunityEventsManager communityId={c.id} eventos={eventos} />
    </div>
  );
}

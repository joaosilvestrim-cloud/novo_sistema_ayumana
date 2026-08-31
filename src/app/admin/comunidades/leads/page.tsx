import Link from "next/link";
import { ArrowLeft, Inbox, Check } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES } from "@/lib/types";
import { toggleLeadHandledAction } from "../actions";
import type { CommunityLead } from "@/lib/communities-types";

export const metadata = { title: "Interesses de parceria" };
const paisNome = (code: string | null) => (code ? COUNTRIES.find((p) => p.code === code)?.name ?? code : "—");

export default async function LeadsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("community_leads").select("*").order("created_at", { ascending: false });
  const leads = (data as CommunityLead[] | null) ?? [];
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/comunidades" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
          <ArrowLeft className="h-4 w-4" /> Comunidades
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl"><Inbox className="h-6 w-6 text-brand-dark" /> Interesses de parceria</h1>
        <p className="mt-1 text-foreground-muted">Líderes que pediram para levar a Ayumana à comunidade deles.</p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">Nenhum interesse ainda.</div>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id} className={`rounded-2xl border bg-background p-5 ${l.handled ? "border-border opacity-70" : "border-brand/30"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{l.community_name || l.contact_name || "Comunidade"}</p>
                  <p className="text-sm text-foreground-muted">
                    {l.contact_name ? `${l.contact_name} · ` : ""}
                    {l.contact_email && <a href={`mailto:${l.contact_email}`} className="text-brand-dark hover:underline">{l.contact_email}</a>}
                    {" · "}{paisNome(l.country_code)}
                  </p>
                  {l.message && <p className="mt-2 max-w-2xl whitespace-pre-line text-sm text-foreground">{l.message}</p>}
                  {l.source_slug && <p className="mt-1 text-xs text-foreground-muted">Veio da página /comunidades/{l.source_slug}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-xs text-foreground-muted">{fmt(l.created_at)}</span>
                  {l.handled ? <Badge tone="success">Tratado</Badge> : <Badge tone="warning">Novo</Badge>}
                  <form action={toggleLeadHandledAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="handled" value={l.handled ? "0" : "1"} />
                    <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted">
                      <Check className="h-3.5 w-3.5" /> {l.handled ? "Reabrir" : "Marcar tratado"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

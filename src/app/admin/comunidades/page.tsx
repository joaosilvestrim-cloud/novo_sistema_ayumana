import Link from "next/link";
import { Users2, Plus, Globe2, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES } from "@/lib/types";
import type { Community } from "@/lib/communities";

export const metadata = { title: "Comunidades" };

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  prospect: "neutral", negotiating: "warning", active: "success", paused: "warning", closed: "danger",
};
const STATUS_LABEL: Record<string, string> = {
  prospect: "Prospecção", negotiating: "Negociando", active: "Ativa", paused: "Pausada", closed: "Encerrada",
};
const paisNome = (code: string) => COUNTRIES.find((p) => p.code === code)?.name ?? code;

export default async function AdminComunidadesPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data } = await admin.from("communities").select("*").order("created_at", { ascending: false });
  const rows = (data as Community[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl"><Users2 className="h-6 w-6 text-brand-dark" /> Comunidades</h1>
          <p className="mt-1 text-foreground-muted">Ayumana nas Comunidades. Cada parceiro ganha uma landing própria e rastreável.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/comunidades/leads" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-heading hover:bg-surface-muted">
            <Inbox className="h-4 w-4" /> Interesses de parceria
          </Link>
          <Link href="/admin/comunidades/nova" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            <Plus className="h-4 w-4" /> Nova comunidade
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3 font-medium">Comunidade</th>
              <th className="px-4 py-3 font-medium">País</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Publicada</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/comunidades/${c.id}`} className="font-medium text-heading hover:text-brand-dark hover:underline">{c.name}</Link>
                  <div className="text-xs text-foreground-muted">/comunidades/{c.slug}</div>
                </td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-foreground-muted"><Globe2 className="h-3.5 w-3.5" /> {paisNome(c.country_code)}</span></td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[c.status] ?? "neutral"}>{STATUS_LABEL[c.status] ?? c.status}</Badge></td>
                <td className="px-4 py-3">{c.is_public ? <Badge tone="success">Sim</Badge> : <Badge tone="neutral">Rascunho</Badge>}</td>
                <td className="px-4 py-3"><Link href={`/admin/comunidades/${c.id}`} className="text-sm font-medium text-brand-dark hover:underline">Gerenciar</Link></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-foreground-muted">Nenhuma comunidade ainda. Crie a primeira.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

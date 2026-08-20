import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { setWaitlistStatusAction } from "./actions";

export const metadata = { title: "Fila Presença" };

type Row = {
  id: string; psychologist_id: string | null;
  name: string | null; email: string | null; phone: string | null;
  city: string | null; crp: string | null; note: string | null;
  status: string; created_at: string;
};

const STATUS = ["pendente", "contatado", "aprovado", "recusado"] as const;
const TONE: Record<string, "warning" | "brand" | "success" | "neutral"> = {
  pendente: "warning", contatado: "brand", aprovado: "success", recusado: "neutral",
};

export default async function AdminPresencaPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("presenca_waitlist")
    .select("id, psychologist_id, name, email, phone, city, crp, note, status, created_at")
    .order("created_at", { ascending: false });
  const rows = (data as Row[]) ?? [];

  // Liga cada inscrito ao perfil no admin (quando já é psicólogo cadastrado).
  const psyIds = rows.map((r) => r.psychologist_id).filter(Boolean) as string[];
  const perfilPorPsy = new Map<string, string>();
  if (psyIds.length) {
    const { data: psys } = await admin.from("psychologists").select("id, profile_id").in("id", psyIds);
    for (const p of (psys ?? []) as { id: string; profile_id: string }[]) perfilPorPsy.set(p.id, p.profile_id);
  }

  const pendentes = rows.filter((r) => r.status === "pendente").length;
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const wa = (t: string | null) => (t ? `https://wa.me/${t.replace(/\D/g, "")}` : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl"><Sparkles className="h-6 w-6 text-brand-dark" /> Fila do Presença</h1>
          <p className="mt-1 text-foreground-muted">Quem se inscreveu para o plano Presença (vagas limitadas). Chame conforme abre vaga.</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-sm font-medium text-yellow-700">{pendentes} pendente(s)</span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-foreground">{rows.length} no total</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background px-6 py-12 text-center text-foreground-muted">
          Ninguém na fila ainda. As inscrições feitas em /para-psicologos aparecem aqui.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const perfil = r.psychologist_id ? perfilPorPsy.get(r.psychologist_id) : null;
            const w = wa(r.phone);
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-heading">{r.name || "—"}</span>
                      <Badge tone={TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                      {!r.psychologist_id && <Badge tone="neutral">sem conta</Badge>}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
                      {r.email && <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>}
                      {r.phone && (w ? <a href={w} target="_blank" className="text-brand-dark hover:underline">{r.phone}</a> : <span>{r.phone}</span>)}
                      {r.city && <span>{r.city}</span>}
                      {r.crp && <span>CRP {r.crp}</span>}
                      <span>inscreveu em {fmt(r.created_at)}</span>
                    </div>
                    {r.note && <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">{r.note}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <form action={setWaitlistStatusAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                        {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover">Salvar</button>
                    </form>
                    {perfil && (
                      <Link href={`/admin/usuarios/${perfil}`} className="text-xs font-medium text-brand-dark hover:underline">Ver no admin →</Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

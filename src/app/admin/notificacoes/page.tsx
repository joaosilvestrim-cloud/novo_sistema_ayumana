import Link from "next/link";
import { CheckCircle2, AlertCircle, Mail, MailX } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailConfigured } from "@/lib/email";
import { Badge } from "@/components/ui/badge";
import { BroadcastForm } from "@/components/admin/broadcast-form";

export const metadata = { title: "Notificações" };

const PAGE_SIZE = 30;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const KIND_LABEL: Record<string, string> = {
  crp_aprovado: "CRP aprovado",
  crp_reprovado: "CRP reprovado",
  trial_7: "Teste — 7 dias",
  trial_1: "Teste — 1 dia",
  senha: "Redefinição de senha",
  suporte: "Pedido de suporte",
  broadcast: "Comunicado",
  outro: "Outro",
};

type Row = {
  id: string;
  kind: string;
  to_email: string;
  subject: string;
  preview: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export default async function NotificacoesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const kind = one(sp.kind);
  const q = one(sp.q).trim();
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const ok = one(sp.ok);
  const erro = one(sp.erro);

  const admin = createAdminClient();

  let query = admin
    .from("notifications")
    .select("id, kind, to_email, subject, preview, status, error, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (kind) query = query.eq("kind", kind);
  if (q) query = query.ilike("to_email", `%${q}%`);

  const { data, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const rows = (data ?? []) as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Resumo dos últimos 7 dias.
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: recentes } = await admin
    .from("notifications")
    .select("kind, status")
    .gte("created_at", desde);
  const semana = {
    total: recentes?.length ?? 0,
    falhas: (recentes ?? []).filter((r) => r.status === "falhou").length,
    suporte: (recentes ?? []).filter((r) => r.kind === "suporte").length,
  };

  const qs = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (q) params.set("q", q);
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    return `/admin/notificacoes?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Notificações</h1>
        <p className="mt-1 text-foreground-muted">
          Tudo que a plataforma enviou por e-mail, e o disparo de comunicados.
        </p>
      </div>

      {!isEmailConfigured() && (
        <p className="flex items-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          O Resend não está configurado (falta <code>RESEND_API_KEY</code>). Nada será enviado de verdade.
        </p>
      )}
      {ok && (
        <p className="flex items-center gap-2 rounded-xl border border-green-600/40 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {ok}
        </p>
      )}
      {erro && (
        <p className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" /> {erro}
        </p>
      )}

      {/* Resumo */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">Enviados (7 dias)</p>
          <p className="mt-1 text-2xl font-semibold text-heading">{semana.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">Falhas (7 dias)</p>
          <p className={`mt-1 text-2xl font-semibold ${semana.falhas ? "text-danger" : "text-heading"}`}>
            {semana.falhas}
          </p>
        </div>
        <Link href={qs({ kind: "suporte", page: "" })} className="rounded-2xl border border-border bg-background p-4 hover:border-brand">
          <p className="text-xs uppercase tracking-wide text-foreground-muted">Pedidos de suporte (7 dias)</p>
          <p className="mt-1 text-2xl font-semibold text-heading">{semana.suporte}</p>
        </Link>
      </div>

      <BroadcastForm />

      {/* Filtros */}
      <form className="flex flex-wrap items-center gap-2" action="/admin/notificacoes">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por e-mail"
          className="h-9 min-w-[200px] flex-1 rounded-lg border border-border bg-background px-3 text-sm"
        />
        <select name="kind" defaultValue={kind} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
          <option value="">Todos os tipos</option>
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <button className="h-9 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-muted">
          Filtrar
        </button>
      </form>

      {/* Histórico */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3 font-medium">Quando</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Para</th>
              <th className="px-4 py-3 font-medium">Assunto</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id} className="border-b border-border last:border-0 align-top">
                <td className="whitespace-nowrap px-4 py-3 text-foreground-muted">
                  {new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={n.kind === "suporte" ? "warning" : "neutral"}>
                    {KIND_LABEL[n.kind] ?? n.kind}
                  </Badge>
                </td>
                <td className="px-4 py-3">{n.to_email}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-heading">{n.subject}</p>
                  {n.preview && (
                    <p className="mt-0.5 line-clamp-2 max-w-md text-xs text-foreground-muted">{n.preview}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {n.status === "enviado" ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <Mail className="h-3.5 w-3.5" /> Enviado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-danger" title={n.error ?? ""}>
                      <MailX className="h-3.5 w-3.5" /> Falhou
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-foreground-muted">
                  Nenhuma notificação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-foreground-muted">
            Página {page} de {totalPages} · {total} registro(s)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted">
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted">
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

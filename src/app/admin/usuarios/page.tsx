import Link from "next/link";
import { Search, ShieldCheck, EyeOff, UserPlus, AlertCircle, Users, Clock } from "lucide-react";
import { getUsersOverview, type AdminUser } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { UserManageModal } from "@/components/admin/user-manage-modal";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { VERIFICATION_LABELS, type PlanTier } from "@/lib/types";

export const metadata = { title: "Usuários" };

const PAGE_SIZE = 20;

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function matches(u: AdminUser, q: string, papel: string, status: string, plano: string) {
  if (papel === "admin" && u.role !== "admin") return false;
  if (papel === "psicologo" && u.role !== "psicologo") return false;
  if (plano && u.plan !== plano) return false;
  if (status === "publicado" && !u.published) return false;
  if (status === "rascunho" && u.published) return false;
  if (status === "pendente" && u.verification !== "pendente") return false;
  if (status === "incompleto" && (u.role !== "psicologo" || u.profileCompleted)) return false;
  if (q) {
    const hay = `${u.name ?? ""} ${u.email ?? ""} ${u.city ?? ""}`.toLowerCase();
    if (!hay.includes(q.toLowerCase())) return false;
  }
  return true;
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const papel = one(sp.papel);
  const status = one(sp.status);
  const plano = one(sp.plano);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const all = await getUsersOverview();
  const filtered = all.filter((u) => matches(u, q, papel, status, plano));

  // KPIs (base inteira, independem dos filtros ativos).
  const kpis = {
    total: all.length,
    psicologos: all.filter((u) => u.role === "psicologo").length,
    pendentes: all.filter((u) => u.verification === "pendente").length,
    incompletos: all.filter((u) => u.role === "psicologo" && !u.profileCompleted).length,
    naoPublicados: all.filter((u) => u.role === "psicologo" && !u.published).length,
  };
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const qs = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (papel) params.set("papel", papel);
    if (status) params.set("status", status);
    if (plano) params.set("plano", plano);
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    return `/admin/usuarios?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Usuários</h1>
          <p className="mt-1 text-foreground-muted">
            {all.length} contas · gerencie papéis, publicação e verificação.
          </p>
        </div>
        <Link
          href="/admin/usuarios/novo"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <UserPlus className="h-4 w-4" /> Novo usuário
        </Link>
      </div>

      {/* KPIs — clique filtra a lista */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { icon: Users, label: "Psicólogos", value: kpis.psicologos, href: "/admin/usuarios?papel=psicologo", tone: "neutral" as const },
          { icon: Clock, label: "Aguardando aprovação", value: kpis.pendentes, href: "/admin/usuarios?status=pendente", tone: kpis.pendentes ? "yellow" as const : "neutral" as const },
          { icon: AlertCircle, label: "Perfis incompletos", value: kpis.incompletos, href: "/admin/usuarios?status=incompleto", tone: kpis.incompletos ? "yellow" as const : "neutral" as const },
          { icon: EyeOff, label: "Não publicados", value: kpis.naoPublicados, href: "/admin/usuarios?status=rascunho", tone: "neutral" as const },
          { icon: ShieldCheck, label: "Total de contas", value: kpis.total, href: "/admin/usuarios", tone: "neutral" as const },
        ].map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`rounded-xl border p-4 transition-shadow hover:shadow-sm ${
              k.tone === "yellow" ? "border-yellow-300 bg-yellow-400/10" : "border-border bg-background"
            }`}
          >
            <k.icon className={`h-5 w-5 ${k.tone === "yellow" ? "text-yellow-700" : "text-foreground-muted"}`} />
            <p className="mt-2 text-2xl font-semibold text-heading">{k.value}</p>
            <p className="text-xs text-foreground-muted">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
          <Search className="h-4 w-4 text-foreground-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, e-mail ou cidade"
            className="h-10 w-full min-w-40 bg-transparent text-sm outline-none"
          />
        </div>
        <select name="papel" defaultValue={papel} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">Todos os papéis</option>
          <option value="psicologo">Psicólogos</option>
          <option value="admin">Admins</option>
        </select>
        <select name="status" defaultValue={status} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">Qualquer status</option>
          <option value="publicado">Publicados</option>
          <option value="rascunho">Rascunho</option>
          <option value="pendente">Verificação pendente</option>
          <option value="incompleto">Perfil incompleto</option>
        </select>
        <select name="plano" defaultValue={plano} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="">Todos os planos</option>
          {(["essencial", "destaque", "ideal", "presenca"] as PlanTier[]).map((t) => (
            <option key={t} value={t}>{PLAN_LABEL[t]}</option>
          ))}
        </select>
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          Filtrar
        </button>
      </form>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Verificação</th>
              <th className="px-4 py-3 font-medium">Publicado</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => {
              const v = u.verification ? VERIFICATION_LABELS[u.verification] : null;
              return (
                <tr key={u.profileId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-heading">{u.name || "—"}</div>
                    <div className="text-xs text-foreground-muted">{u.email}</div>
                    {u.city && <div className="text-xs text-foreground-muted">{u.city}</div>}
                    {u.role === "psicologo" && !u.profileCompleted && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
                        <AlertCircle className="h-3 w-3" /> Perfil incompleto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? <Badge tone="brand">Admin</Badge> : <Badge tone="neutral">Psicólogo</Badge>}
                  </td>
                  <td className="px-4 py-3">{u.plan ? PLAN_LABEL[u.plan] : "—"}</td>
                  <td className="px-4 py-3">{v ? <Badge tone={v.tone}>{v.label}</Badge> : "—"}</td>
                  <td className="px-4 py-3">
                    {u.published ? <Badge tone="success">Sim</Badge> : <Badge tone="neutral">Não</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <UserManageModal u={u} canDelete={u.profileId !== me.id} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-foreground-muted">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between text-sm text-foreground-muted">
        <span>{total} resultado(s)</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {page > 1 && <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted">Anterior</Link>}
            <span>Página {page} de {totalPages}</span>
            {page < totalPages && <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted">Próxima</Link>}
          </div>
        )}
      </div>
    </div>
  );
}

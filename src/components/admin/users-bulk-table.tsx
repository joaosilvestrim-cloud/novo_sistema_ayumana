"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, BadgeCheck, Trash2, X } from "lucide-react";
import type { AdminUser } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { UserManageModal } from "@/components/admin/user-manage-modal";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { VERIFICATION_LABELS, type PlanTier } from "@/lib/types";
import { bulkUsersAction } from "@/app/admin/usuarios/actions";

const TIERS: PlanTier[] = ["essencial", "destaque", "ideal", "presenca"];

export function UsersBulkTable({ rows, meId }: { rows: AdminUser[]; meId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [plan, setPlan] = useState<PlanTier>("destaque");
  const formRef = useRef<HTMLFormElement>(null);
  const opRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.profileId));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.profileId)));

  const selectedRows = rows.filter((r) => selected.has(r.profileId));
  const psyIds = useMemo(() => selectedRows.map((r) => r.psyId).filter(Boolean).join(","), [selectedRows]);
  const profileIds = useMemo(() => selectedRows.map((r) => r.profileId).join(","), [selectedRows]);

  const run = (op: string) => {
    if (op === "delete" && !window.confirm(`Excluir ${selected.size} usuário(s) permanentemente? Esta ação não pode ser desfeita.`)) return;
    if (opRef.current) opRef.current.value = op;
    formRef.current?.requestSubmit();
  };

  return (
    <div className="space-y-3">
      {/* Barra de ações em massa */}
      {selected.size > 0 && (
        <form
          ref={formRef}
          action={bulkUsersAction}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/40 bg-brand/5 px-4 py-3"
        >
          <input ref={opRef} type="hidden" name="op" defaultValue="" />
          <input type="hidden" name="psy_ids" value={psyIds} />
          <input type="hidden" name="profile_ids" value={profileIds} />
          <span className="mr-1 text-sm font-medium text-heading">{selected.size} selecionado(s)</span>
          <button type="button" onClick={() => run("publish")} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs hover:bg-surface-muted">
            <Eye className="h-3.5 w-3.5" /> Publicar
          </button>
          <button type="button" onClick={() => run("unpublish")} className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs hover:bg-surface-muted">
            <EyeOff className="h-3.5 w-3.5" /> Despublicar
          </button>
          <button type="button" onClick={() => run("approve")} className="inline-flex h-8 items-center gap-1 rounded-md border border-green-600/40 bg-background px-2.5 text-xs text-green-700 hover:bg-green-50">
            <BadgeCheck className="h-3.5 w-3.5" /> Aprovar
          </button>
          <span className="flex items-center gap-1">
            <select value={plan} name="plan" onChange={(e) => setPlan(e.target.value as PlanTier)} className="h-8 rounded-md border border-border bg-background px-2 text-xs">
              {TIERS.map((t) => <option key={t} value={t}>{PLAN_LABEL[t]}</option>)}
            </select>
            <button type="button" onClick={() => run("plan")} className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2.5 text-xs hover:bg-surface-muted">
              Aplicar plano
            </button>
          </span>
          <button type="button" onClick={() => run("delete")} className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/40 bg-background px-2.5 text-xs text-danger hover:bg-danger/10">
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-foreground-muted hover:bg-surface-muted">
            <X className="h-3.5 w-3.5" /> Limpar
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-[var(--ayu-verde)]" aria-label="Selecionar todos" />
              </th>
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
              const sel = selected.has(u.profileId);
              return (
                <tr key={u.profileId} className={`border-b border-border last:border-0 ${sel ? "bg-brand/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={sel} onChange={() => toggle(u.profileId)} className="h-4 w-4 accent-[var(--ayu-verde)]" aria-label={`Selecionar ${u.name ?? u.email}`} />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/usuarios/${u.profileId}`} className="font-medium text-heading hover:text-brand-dark hover:underline">
                      {u.name || "—"}
                    </Link>
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
                  <td className="px-4 py-3">{u.published ? <Badge tone="success">Sim</Badge> : <Badge tone="neutral">Não</Badge>}</td>
                  <td className="px-4 py-3">
                    <UserManageModal u={u} canDelete={u.profileId !== meId} />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, BadgeCheck, Trash2, X, Gift } from "lucide-react";
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
  const [aviso, setAviso] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const opRef = useRef<HTMLInputElement>(null);
  const psyIdsRef = useRef<HTMLInputElement>(null);
  const profileIdsRef = useRef<HTMLInputElement>(null);

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

  const nomeOuEmail = (r: AdminUser) => r.name || r.email;

  const run = (op: string) => {
    setAviso(null);
    if (op === "delete" && !window.confirm(`Excluir ${selected.size} usuário(s) permanentemente? Esta ação não pode ser desfeita.`)) return;

    let psyIds = selectedRows.map((r) => r.psyId).filter(Boolean);

    // Publicar: o admin pode publicar mesmo incompleto. A única trava é a
    // verificação (senão o selo "CRP verificado" apareceria sem conferência).
    if (op === "publish") {
      const publicaveis = selectedRows.filter((r) => r.psyId && r.verification === "aprovado");
      const naoVerificados = selectedRows.filter((r) => r.verification !== "aprovado");

      if (publicaveis.length === 0) {
        setAviso(
          `Não dá para publicar: o perfil precisa estar VERIFICADO (aprovado) primeiro, senão o selo de "CRP verificado" apareceria sem conferência. ` +
          `Aprove antes de publicar: ${naoVerificados.map(nomeOuEmail).join(", ")}.`
        );
        return;
      }

      // Verificados mas incompletos: dá para publicar, mas confirmamos.
      const incompletos = publicaveis.filter((r) => !r.profileCompleted);
      if (incompletos.length > 0) {
        const ok = window.confirm(
          `Vou publicar ${publicaveis.length} perfil(is). ${incompletos.length} ainda não está(ão) 100% completo(s):\n\n` +
          incompletos.map((r) => `• ${nomeOuEmail(r)}`).join("\n") +
          `\n\nDá para publicar mesmo assim. Continuar?`
        );
        if (!ok) return;
      }

      if (naoVerificados.length > 0) {
        setAviso(
          `Publiquei os verificados. Não publiquei ${naoVerificados.length} por não estar(em) verificado(s): ` +
          naoVerificados.map(nomeOuEmail).join(", ") + `. Aprove antes de publicar.`
        );
      }
      psyIds = publicaveis.map((r) => r.psyId).filter(Boolean);
    }

    if (psyIdsRef.current) psyIdsRef.current.value = psyIds.join(",");
    if (profileIdsRef.current) profileIdsRef.current.value = selectedRows.map((r) => r.profileId).join(",");
    if (opRef.current) opRef.current.value = op;
    formRef.current?.requestSubmit();
  };

  return (
    <div className="space-y-3">
      {aviso && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso(null)} className="shrink-0 text-amber-700 hover:text-amber-900" aria-label="Fechar aviso">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Barra de ações em massa */}
      {selected.size > 0 && (
        <form
          ref={formRef}
          action={bulkUsersAction}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/40 bg-brand/5 px-4 py-3"
        >
          <input ref={opRef} type="hidden" name="op" defaultValue="" />
          <input ref={psyIdsRef} type="hidden" name="psy_ids" defaultValue="" />
          <input ref={profileIdsRef} type="hidden" name="profile_ids" defaultValue="" />
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
          <button type="button" onClick={() => run("trial")} className="inline-flex h-8 items-center gap-1 rounded-md border border-brand/50 bg-background px-2.5 text-xs text-brand-dark hover:bg-brand/10">
            <Gift className="h-3.5 w-3.5" /> Dar 30 dias de Voz
          </button>
          <button type="button" onClick={() => run("trial_end")} className="inline-flex h-8 items-center rounded-md border border-border bg-background px-2.5 text-xs hover:bg-surface-muted">
            Encerrar teste
          </button>
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
              // Plano efetivo: no teste, vale o plano do teste (Voz), não o
              // plan_tier cru (que continua Raiz durante a cortesia).
              const emTeste = !!u.trialEndsAt && new Date(u.trialEndsAt) > new Date();
              const planoEfetivo = emTeste ? (u.trialTier ?? u.plan) : u.plan;
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
                    {u.role === "admin" ? <Badge tone="brand">Admin</Badge> : u.role === "conteudo" ? <Badge tone="warning">Conteúdo</Badge> : <Badge tone="neutral">Psicólogo</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-heading">{planoEfetivo ? PLAN_LABEL[planoEfetivo] : "—"}</span>
                    {emTeste && (
                      <span className="ml-1.5 rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
                        teste
                      </span>
                    )}
                    {emTeste && u.trialEndsAt && (
                      <span className="mt-0.5 block text-[11px] text-foreground-muted">
                        cortesia até {new Date(u.trialEndsAt).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {!emTeste && u.subscription === "ativa" && u.plan && u.plan !== "essencial" && (
                      <span className="mt-0.5 block text-[11px] font-medium text-green-600">pagante</span>
                    )}
                  </td>
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

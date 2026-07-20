"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings2, X, ExternalLink, Trash2, KeyRound, ShieldCheck,
  Eye, EyeOff, BadgeCheck, AlertCircle,
} from "lucide-react";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { VERIFICATION_LABELS, type PlanTier, type VerificationStatus, type UserRole } from "@/lib/types";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  setRoleAction, togglePublishAction, quickApproveAction,
  changePlanAction, deleteUserAction, sendPasswordResetAction,
} from "@/app/admin/usuarios/actions";

const TIERS: PlanTier[] = ["essencial", "destaque", "ideal", "presenca"];

export type ManageUser = {
  profileId: string;
  psyId: string | null;
  name: string | null;
  email: string | null;
  city: string | null;
  slug: string | null;
  role: UserRole;
  plan: PlanTier | null;
  verification: VerificationStatus | null;
  published: boolean;
  profileCompleted: boolean;
};

const btn = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted";

export function UserManageModal({ u, canDelete }: { u: ManageUser; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const v = u.verification ? VERIFICATION_LABELS[u.verification] : null;

  return (
    <>
      <button onClick={() => setOpen(true)} className={btn} title="Gerenciar usuário">
        <Settings2 className="h-4 w-4" /> Gerenciar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-heading">{u.name || "—"}</p>
                <p className="truncate text-sm text-foreground-muted">{u.email}</p>
                {u.city && <p className="text-xs text-foreground-muted">{u.city}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-surface-muted px-2 py-0.5">{u.role === "admin" ? "Admin" : u.role === "conteudo" ? "Conteúdo" : "Psicólogo"}</span>
                  {v && <span className="rounded-full bg-surface-muted px-2 py-0.5">{v.label}</span>}
                  <span className="rounded-full bg-surface-muted px-2 py-0.5">{u.published ? "Publicado" : "Rascunho"}</span>
                  {u.role === "psicologo" && !u.profileCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-0.5 text-yellow-700">
                      <AlertCircle className="h-3 w-3" /> Incompleto
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto p-5">
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/usuarios/${u.profileId}`} className={`${btn} flex-1`}>
                  <Settings2 className="h-4 w-4" /> Página completa
                </Link>
                {u.slug && u.published && (
                  <Link href={`/psicologo/${u.slug}`} target="_blank" className={`${btn} flex-1`}>
                    <ExternalLink className="h-4 w-4" /> Ver perfil
                  </Link>
                )}
              </div>

              {/* Plano */}
              {u.psyId && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">Plano</p>
                  <form action={changePlanAction} className="flex gap-2">
                    <input type="hidden" name="psy_id" value={u.psyId} />
                    <select name="plan" defaultValue={u.plan ?? "essencial"} className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm">
                      {TIERS.map((t) => <option key={t} value={t}>{PLAN_LABEL[t]}</option>)}
                    </select>
                    <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
                      Salvar
                    </button>
                  </form>
                </div>
              )}

              {/* Verificação e publicação */}
              {u.psyId && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">Verificação e publicação</p>
                  <div className="flex flex-wrap gap-2">
                    {u.verification !== "aprovado" && (
                      <form action={quickApproveAction}>
                        <input type="hidden" name="psy_id" value={u.psyId} />
                        <button className={`${btn} border-green-600/40 text-green-700 hover:bg-green-50`}>
                          <BadgeCheck className="h-4 w-4" /> Aprovar e publicar
                        </button>
                      </form>
                    )}
                    <form action={togglePublishAction}>
                      <input type="hidden" name="psy_id" value={u.psyId} />
                      <input type="hidden" name="publish" value={u.published ? "0" : "1"} />
                      <button className={btn}>
                        {u.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {u.published ? "Despublicar" : "Publicar"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Acesso */}
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">Acesso</p>
                <div className="flex flex-wrap items-center gap-2">
                  <form action={setRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="profile_id" value={u.profileId} />
                    <select name="role" defaultValue={u.role} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                      <option value="psicologo">Psicólogo</option>
                      <option value="admin">Admin</option>
                      <option value="conteudo">Conteúdo / Estúdio</option>
                    </select>
                    <button className={btn}><ShieldCheck className="h-4 w-4" /> Definir papel</button>
                  </form>
                  {u.email && (
                    <form action={sendPasswordResetAction}>
                      <input type="hidden" name="email" value={u.email} />
                      <ConfirmButton
                        message={`Enviar e-mail de redefinição de senha para ${u.email}?`}
                        className={btn}
                      >
                        <KeyRound className="h-4 w-4" /> Redefinir senha
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </div>

              {/* Zona de perigo */}
              {canDelete && (
                <div className="border-t border-border pt-4">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-danger">Zona de perigo</p>
                  <form action={deleteUserAction}>
                    <input type="hidden" name="profile_id" value={u.profileId} />
                    <ConfirmButton
                      message={`Excluir "${u.name || u.email}" permanentemente? Esta ação não pode ser desfeita.`}
                      className={`${btn} w-full border-danger/40 text-danger hover:bg-danger/10`}
                    >
                      <Trash2 className="h-4 w-4" /> Excluir usuário
                    </ConfirmButton>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

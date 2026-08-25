"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings2, X, ExternalLink, Trash2, KeyRound, ShieldCheck,
  Eye, EyeOff, BadgeCheck, AlertCircle, Gift, Unlock, Loader2, Check,
} from "lucide-react";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { VERIFICATION_LABELS, type PlanTier, type VerificationStatus, type UserRole } from "@/lib/types";
import { ConfirmButton } from "@/components/admin/confirm-button";
import {
  setRoleAction, togglePublishAction, quickApproveAction,
  changePlanAction, deleteUserAction, sendPasswordResetAction,
  grantTrialAction, revokeTrialAction, setPasswordAction,
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
  trialTier?: PlanTier | null;
  trialEndsAt?: string | null;
  verification: VerificationStatus | null;
  published: boolean;
  profileCompleted: boolean;
};

const btn = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted";

export function UserManageModal({ u, canDelete }: { u: ManageUser; canDelete: boolean }) {
  const [open, setOpen] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();
  const v = u.verification ? VERIFICATION_LABELS[u.verification] : null;
  const emTeste = !!u.trialEndsAt && new Date(u.trialEndsAt) > new Date();

  // Runner único: mostra "Salvando…" no botão, dá retorno de sucesso/erro e
  // atualiza a tela. Antes as ações rodavam sem animação e sem avisar do erro.
  async function run(
    key: string,
    fd: FormData,
    fn: (f: FormData) => Promise<{ ok: boolean; error?: string } | void>,
    successMsg: string
  ) {
    if (pendingKey) return;
    setPendingKey(key);
    setFeedback(null);
    try {
      const res = await fn(fd);
      if (res && "ok" in res && !res.ok) {
        setFeedback({ ok: false, msg: res.error || "Não foi possível concluir." });
      } else {
        setFeedback({ ok: true, msg: successMsg });
        router.refresh();
      }
    } catch (e) {
      setFeedback({ ok: false, msg: (e as Error)?.message || "Não foi possível concluir. Tente de novo." });
    } finally {
      setPendingKey(null);
    }
  }

  const onSubmit =
    (key: string, fn: (f: FormData) => Promise<{ ok: boolean; error?: string } | void>, successMsg: string | ((fd: FormData) => string)) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      run(key, fd, fn, typeof successMsg === "function" ? successMsg(fd) : successMsg);
    };

  // Conteúdo do botão: troca por "Salvando…" quando esta ação está rodando.
  const spin = (key: string, normal: React.ReactNode) =>
    pendingKey === key ? (
      <span className="inline-flex items-center gap-1.5"><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</span>
    ) : (
      normal
    );

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
              {feedback && (
                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${feedback.ok ? "border-green-200 bg-green-50 text-green-800" : "border-danger/30 bg-danger/10 text-danger"}`}>
                  {feedback.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span className="flex-1">{feedback.msg}</span>
                </div>
              )}

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
                  <form onSubmit={onSubmit("plan", changePlanAction, (fd) => `Plano alterado para ${PLAN_LABEL[String(fd.get("plan")) as PlanTier]}.`)} className="flex gap-2">
                    <input type="hidden" name="psy_id" value={u.psyId} />
                    <select name="plan" defaultValue={u.plan ?? "essencial"} className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm">
                      {TIERS.map((t) => <option key={t} value={t}>{PLAN_LABEL[t]}</option>)}
                    </select>
                    <button type="submit" disabled={!!pendingKey} className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-60">
                      {spin("plan", "Salvar")}
                    </button>
                  </form>
                </div>
              )}

              {/* Teste gratuito */}
              {u.psyId && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">Teste gratuito</p>
                  {emTeste ? (
                    <p className="mb-2 text-sm text-brand-dark">
                      Em teste do {u.trialTier ? PLAN_LABEL[u.trialTier] : "Voz"} até{" "}
                      {new Date(u.trialEndsAt!).toLocaleDateString("pt-BR")}.
                    </p>
                  ) : (
                    <p className="mb-2 text-sm text-foreground-muted">Sem teste ativo.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <form onSubmit={onSubmit("trial", grantTrialAction, `${emTeste ? "Teste renovado" : "Voz concedido"}.`)} className="flex items-center gap-2">
                      <input type="hidden" name="psy_id" value={u.psyId} />
                      <select name="dias" defaultValue="30" className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                        <option value="7">7 dias</option>
                        <option value="15">15 dias</option>
                        <option value="30">30 dias</option>
                        <option value="60">60 dias</option>
                        <option value="90">90 dias</option>
                      </select>
                      <button type="submit" disabled={!!pendingKey} className={btn}>{spin("trial", <><Gift className="h-4 w-4" /> {emTeste ? "Renovar" : "Conceder"} Voz</>)}</button>
                    </form>
                    {emTeste && (
                      <form onSubmit={onSubmit("trial_end", revokeTrialAction, "Teste encerrado.")}>
                        <input type="hidden" name="psy_id" value={u.psyId} />
                        <button type="submit" disabled={!!pendingKey} className={btn}>{spin("trial_end", "Encerrar teste")}</button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Verificação e publicação */}
              {u.psyId && (
                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">Verificação e publicação</p>
                  <div className="flex flex-wrap gap-2">
                    {u.verification !== "aprovado" && (
                      <form onSubmit={onSubmit("approve", quickApproveAction, "Aprovado e publicado.")}>
                        <input type="hidden" name="psy_id" value={u.psyId} />
                        <button type="submit" disabled={!!pendingKey} className={`${btn} border-green-600/40 text-green-700 hover:bg-green-50`}>
                          {spin("approve", <><BadgeCheck className="h-4 w-4" /> Aprovar e publicar</>)}
                        </button>
                      </form>
                    )}
                    <form onSubmit={onSubmit("publish", togglePublishAction, u.published ? "Despublicado." : "Publicado na vitrine.")}>
                      <input type="hidden" name="psy_id" value={u.psyId} />
                      <input type="hidden" name="publish" value={u.published ? "0" : "1"} />
                      <button type="submit" disabled={!!pendingKey} className={btn}>
                        {spin("publish", <>{u.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{u.published ? "Despublicar" : "Publicar"}</>)}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Acesso */}
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">Acesso</p>
                <div className="flex flex-wrap items-center gap-2">
                  <form onSubmit={onSubmit("role", setRoleAction, "Papel atualizado.")} className="flex items-center gap-2">
                    <input type="hidden" name="profile_id" value={u.profileId} />
                    <select name="role" defaultValue={u.role} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                      <option value="psicologo">Psicólogo</option>
                      <option value="admin">Admin</option>
                      <option value="conteudo">Conteúdo / Estúdio</option>
                    </select>
                    <button type="submit" disabled={!!pendingKey} className={btn}>{spin("role", <><ShieldCheck className="h-4 w-4" /> Definir papel</>)}</button>
                  </form>
                  {u.email && (
                    <form action={sendPasswordResetAction}>
                      <input type="hidden" name="email" value={u.email} />
                      <ConfirmButton
                        message={`Enviar e-mail de redefinição de senha para ${u.email}?`}
                        className={btn}
                      >
                        <KeyRound className="h-4 w-4" /> Redefinir por e-mail
                      </ConfirmButton>
                    </form>
                  )}
                </div>

                {/* Destrava quem não consegue pelo link. Não usa e-mail. */}
                <div className="mt-3 rounded-lg border border-border bg-surface-muted/50 p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-heading">
                    <Unlock className="h-3.5 w-3.5" /> Liberar acesso na hora
                  </p>
                  <p className="mb-2 text-xs text-foreground-muted">
                    Define a senha e confirma o e-mail. Depois passe a senha à pessoa por WhatsApp.
                  </p>
                  <form action={setPasswordAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="profile_id" value={u.profileId} />
                    <input
                      name="password"
                      type="text"
                      minLength={8}
                      required
                      defaultValue={`ayumana${new Date().getFullYear()}`}
                      className="h-9 min-w-[160px] flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                    />
                    <ConfirmButton
                      message={`Definir esta senha para ${u.email} e liberar o acesso?`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                    >
                      <Unlock className="h-4 w-4" /> Definir e liberar
                    </ConfirmButton>
                  </form>
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

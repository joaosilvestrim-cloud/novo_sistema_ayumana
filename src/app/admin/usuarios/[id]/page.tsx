import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, ExternalLink, BadgeCheck, Eye, EyeOff, ShieldCheck,
  KeyRound, Trash2, User, MapPin, Phone, Calendar, CreditCard,
  Unlock, CheckCircle2, AlertCircle, Percent,
} from "lucide-react";
import { getUserDetail } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { AvatarBubble } from "@/components/ui/avatar-bubble";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PLAN_LABEL } from "@/lib/plan-labels";
import {
  VERIFICATION_LABELS, SUBSCRIPTION_LABELS,
  type PlanTier, type VerificationStatus, type SubscriptionStatus,
} from "@/lib/types";
import {
  setRoleAction, togglePublishAction, quickApproveAction,
  changePlanAction, deleteUserAction, sendPasswordResetAction, setPasswordAction,
} from "../actions";
import { applyDiscountAction, removeDiscountAction } from "../discount-actions";

export const metadata = { title: "Gerenciar usuário" };

const TIERS: PlanTier[] = ["essencial", "destaque", "ideal", "presenca"];
const btn = "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function Info({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
      <div>
        <dt className="text-xs text-foreground-muted">{label}</dt>
        <dd className="text-sm text-heading">{value || "—"}</dd>
      </div>
    </div>
  );
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const me = await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const detail = await getUserDetail(id);
  if (!detail) notFound();

  const { profile, psy } = detail;
  const s = (k: string) => (psy?.[k] as string | null) ?? null;
  const plan = (s("plan_tier") as PlanTier) ?? null;
  const verification = (s("verification_status") as VerificationStatus) ?? null;
  const subscription = (s("subscription_status") as SubscriptionStatus) ?? null;
  const published = !!psy?.["is_published"];
  const completed = !!psy?.["profile_completed"];
  const psyId = (s("id") as string) ?? null;
  const slug = s("slug");
  const v = verification ? VERIFICATION_LABELS[verification] : null;
  const sub = subscription ? SUBSCRIPTION_LABELS[subscription] : null;
  const canDelete = profile.id !== me.id;

  return (
    <div className="space-y-6">
      <Link href="/admin/usuarios" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
        <ArrowLeft className="h-4 w-4" /> Voltar para usuários
      </Link>

      {sp.ok && (
        <p className="flex items-center gap-2 rounded-xl border border-green-600/40 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {sp.ok}
        </p>
      )}
      {sp.erro && (
        <p className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" /> {sp.erro}
        </p>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:flex-row sm:items-center">
        <AvatarBubble src={s("avatar_url")} name={profile.full_name} seed={psyId ?? profile.id} size={110} className="w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl">{profile.full_name || "—"}</h1>
          <p className="text-foreground-muted">{profile.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={profile.role === "admin" ? "brand" : profile.role === "conteudo" ? "warning" : "neutral"}>{profile.role === "admin" ? "Admin" : profile.role === "conteudo" ? "Conteúdo" : "Psicólogo"}</Badge>
            {v && <Badge tone={v.tone}>{v.label}</Badge>}
            <Badge tone={published ? "success" : "neutral"}>{published ? "Publicado" : "Rascunho"}</Badge>
            {psy && !completed && <Badge tone="warning">Perfil incompleto</Badge>}
          </div>
        </div>
        {slug && published && (
          <Link href={`/psicologo/${slug}`} target="_blank" className={btn}>
            <ExternalLink className="h-4 w-4" /> Ver perfil
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Detalhes */}
        <section className="rounded-2xl border border-border bg-background p-6 lg:col-span-2">
          <h2 className="text-lg">Dados</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Info icon={User} label="CRP" value={s("crp_number") ? `${s("crp_number")}${s("crp_uf") ? `/${s("crp_uf")}` : ""}` : "—"} />
            <Info icon={MapPin} label="Cidade" value={[s("city"), s("state")].filter(Boolean).join(" / ")} />
            <Info icon={Phone} label="WhatsApp" value={s("phone_whatsapp")} />
            <Info icon={Calendar} label="Cadastro" value={fmtDate(profile.created_at)} />
            <Info icon={BadgeCheck} label="Verificado em" value={fmtDate(s("verified_at"))} />
            <Info icon={User} label="Perfil completo" value={psy ? (completed ? "Sim" : "Não") : "—"} />
          </dl>
          {s("headline") && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs text-foreground-muted">Título do perfil</p>
              <p className="text-sm text-heading">{s("headline")}</p>
            </div>
          )}
        </section>

        {/* Assinatura */}
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-teal-600" /> Assinatura
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs text-foreground-muted">Plano atual</dt>
              <dd className="text-sm font-medium text-heading">{plan ? PLAN_LABEL[plan] : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">Status</dt>
              <dd>{sub ? <Badge tone={sub.tone}>{sub.label}</Badge> : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">Vigência até</dt>
              <dd className="text-sm text-heading">{fmtDate(s("subscription_period_end"))}</dd>
            </div>
          </dl>
          {psyId && (
            <form action={changePlanAction} className="mt-4 flex gap-2 border-t border-border pt-4">
              <input type="hidden" name="psy_id" value={psyId} />
              <select name="plan" defaultValue={plan ?? "essencial"} className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm">
                {TIERS.map((t) => <option key={t} value={t}>{PLAN_LABEL[t]}</option>)}
              </select>
              <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">Salvar</button>
            </form>
          )}

          {/* Desconto do cliente (sem código) */}
          {psyId && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                <Percent className="h-3.5 w-3.5" /> Desconto do cliente
              </p>
              {s("admin_discount_pct") ? (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-brand/10 px-3 py-2 text-sm">
                  <span className="font-medium text-brand-dark">
                    {s("admin_discount_pct")}% ·{" "}
                    {s("admin_discount_duration") === "first_year" ? "1º ano"
                      : s("admin_discount_duration") === "first_payment" ? "1ª cobrança" : "sempre"}
                  </span>
                  <form action={removeDiscountAction}>
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <button className="text-xs font-medium text-danger hover:underline">Remover</button>
                  </form>
                </div>
              ) : (
                <p className="mb-2 text-xs text-foreground-muted">
                  Aplique um desconto sem código. Vale no próximo checkout, ou já na assinatura atual se houver.
                </p>
              )}
              <form action={applyDiscountAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="profile_id" value={profile.id} />
                <input name="percent" type="number" min="1" max="100" defaultValue="50" className="h-9 w-20 rounded-lg border border-border bg-background px-2 text-sm" />
                <span className="pb-2 text-sm text-foreground-muted">%</span>
                <select name="duration" defaultValue="first_year" className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                  <option value="first_year">Primeiro ano</option>
                  <option value="first_payment">1ª cobrança</option>
                  <option value="forever">Sempre</option>
                </select>
                <button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
                  {s("admin_discount_pct") ? "Atualizar" : "Aplicar"}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>

      {/* Ações */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Ações</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {psyId && verification !== "aprovado" && (
            <form action={quickApproveAction}>
              <input type="hidden" name="psy_id" value={psyId} />
              <button className={`${btn} border-green-600/40 text-green-700 hover:bg-green-50`}><BadgeCheck className="h-4 w-4" /> Aprovar e publicar</button>
            </form>
          )}
          {psyId && (
            <form action={togglePublishAction}>
              <input type="hidden" name="psy_id" value={psyId} />
              <input type="hidden" name="publish" value={published ? "0" : "1"} />
              <button className={btn}>{published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{published ? "Despublicar" : "Publicar"}</button>
            </form>
          )}
          <form action={setRoleAction} className="flex items-center gap-2">
            <input type="hidden" name="profile_id" value={profile.id} />
            <select name="role" defaultValue={profile.role} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
              <option value="psicologo">Psicólogo</option>
              <option value="admin">Admin</option>
              <option value="conteudo">Conteúdo / Estúdio</option>
            </select>
            <button className={btn}><ShieldCheck className="h-4 w-4" /> Definir papel</button>
          </form>
          {profile.email && (
            <form action={sendPasswordResetAction}>
              <input type="hidden" name="email" value={profile.email} />
              <ConfirmButton message={`Enviar e-mail de redefinição de senha para ${profile.email}?`} className={btn}>
                <KeyRound className="h-4 w-4" /> Redefinir senha (por e-mail)
              </ConfirmButton>
            </form>
          )}
        </div>

        {/* Liberar acesso sem depender de e-mail: destrava quem trava no link. */}
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Unlock className="h-3.5 w-3.5" /> Liberar acesso manualmente
          </p>
          <p className="mb-2 text-xs text-foreground-muted">
            Define a senha na hora e confirma o e-mail. Use quando a pessoa não
            consegue pelo link. Depois passe a senha a ela por WhatsApp.
          </p>
          <form action={setPasswordAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="profile_id" value={profile.id} />
            <input
              name="password"
              type="text"
              minLength={8}
              required
              placeholder="Senha temporária (mín. 8)"
              defaultValue={`ayumana${new Date().getFullYear()}`}
              className="h-9 min-w-[220px] flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            />
            <ConfirmButton
              message={`Definir esta senha para ${profile.email} e liberar o acesso? A pessoa entra com ela e pode trocar depois.`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              <Unlock className="h-4 w-4" /> Definir e liberar
            </ConfirmButton>
          </form>
        </div>

        {canDelete && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-danger">Zona de perigo</p>
            <form action={deleteUserAction}>
              <input type="hidden" name="profile_id" value={profile.id} />
              <ConfirmButton message={`Excluir "${profile.full_name || profile.email}" permanentemente? Esta ação não pode ser desfeita.`} className={`${btn} border-danger/40 text-danger hover:bg-danger/10`}>
                <Trash2 className="h-4 w-4" /> Excluir usuário
              </ConfirmButton>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

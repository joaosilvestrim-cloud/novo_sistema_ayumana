import type { ReactNode } from "react";
import Link from "next/link";
import {
  CreditCard, TrendingUp, AlertCircle, Gift, CheckCircle2, Clock,
  Sparkles, Wallet, Users, Target,
} from "lucide-react";
import { isAsaasConfigured, asaasEnv } from "@/lib/payments/asaas";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PlanPriceEditor } from "@/components/admin/plan-price-editor";
import { grantTrialAllAction, endTrialAllAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { chargeCents, formatCents } from "@/lib/pricing";
import { type PlanTier, type SubscriptionStatus } from "@/lib/types";

export const metadata = { title: "Assinaturas" };

const PLANOS: PlanTier[] = ["essencial", "destaque", "ideal", "presenca"];
const PLAN_COLOR: Record<PlanTier, string> = {
  essencial: "#9AA8A4",
  destaque: "#53C4CC",
  ideal: "#73A533",
  presenca: "#05474A",
};

type Psy = {
  id: string; profile_id: string; display_name: string | null; slug: string | null;
  city: string | null; state: string | null; crp_number: string | null; crp_uf: string | null;
  phone_whatsapp: string | null;
  plan_tier: PlanTier; subscription_status: SubscriptionStatus; subscription_period_end: string | null;
  billing_period: string | null; coupon_pct: number | null; coupon_ends_at: string | null;
  pending_plan_tier: PlanTier | null; pending_billing_period: string | null;
  trial_tier: PlanTier | null; trial_ends_at: string | null; campaign_voz_granted_at: string | null;
  profile_completed: boolean | null; verification_status: string | null; is_published: boolean | null;
  created_at: string | null; asaas_subscription_id: string | null; profile_updated_at: string | null;
};

/** Cartão de indicador. */
function Stat({
  icon, label, value, sub, tone = "neutral",
}: {
  icon: ReactNode; label: string; value: string; sub?: string;
  tone?: "brand" | "green" | "yellow" | "neutral";
}) {
  const chip =
    tone === "green" ? "bg-green-100 text-green-800"
    : tone === "yellow" ? "bg-yellow-100 text-yellow-800"
    : tone === "brand" ? "bg-teal-100 text-teal-800"
    : "bg-surface-muted text-foreground-muted";
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-heading">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
}

/** Barra horizontal proporcional. */
function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-sm text-foreground">{label}</div>
      <div className="h-6 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: color }} />
      </div>
      <div className="w-24 shrink-0 text-right text-sm">
        <span className="font-semibold text-heading">{count}</span>
        <span className="ml-1 text-xs text-foreground-muted">{pct}%</span>
      </div>
    </div>
  );
}

/** Etapa do funil, com taxa em relação ao topo. */
function Funil({ label, count, base, color }: { label: string; count: number; base: number; color: string }) {
  const pct = base > 0 ? Math.round((count / base) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 shrink-0 text-sm text-foreground">{label}</div>
      <div className="h-8 flex-1 overflow-hidden rounded-lg bg-surface-muted">
        <div className="flex h-full items-center justify-end rounded-lg px-2 text-xs font-semibold text-white" style={{ width: `${Math.max(pct, 8)}%`, background: color }}>
          {count}
        </div>
      </div>
      <div className="w-14 shrink-0 text-right text-sm font-medium text-foreground-muted">{pct}%</div>
    </div>
  );
}

function Grupo({
  titulo, descricao, rows, plano, badge, vazio,
}: {
  titulo: string; descricao: string; rows: Psy[];
  plano: (r: Psy) => string;
  badge: (r: Psy) => { tone: "success" | "warning" | "brand" | "neutral"; label: string };
  vazio: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-background">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-lg">{titulo} ({rows.length})</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">{descricao}</p>
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-foreground-muted">{vazio}</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.slice(0, 40).map((r) => {
            const b = badge(r);
            return (
              <li key={r.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0">
                  {r.slug ? (
                    <Link href={`/psicologo/${r.slug}`} target="_blank" className="font-medium text-heading hover:text-brand-dark">{r.display_name || "—"}</Link>
                  ) : (
                    <span className="font-medium text-heading">{r.display_name || "—"}</span>
                  )}
                  <p className="text-xs text-foreground-muted">{plano(r)}</p>
                </div>
                <Badge tone={b.tone}>{b.label}</Badge>
              </li>
            );
          })}
          {rows.length > 40 && (
            <li className="px-6 py-3 text-center text-xs text-foreground-muted">e mais {rows.length - 40}…</li>
          )}
        </ul>
      )}
    </section>
  );
}

export default async function AdminAssinaturasPage() {
  const supabase = createAdminClient();
  const now = new Date();

  const [{ data: psysRaw }, { data: plansRaw }, { data: profilesRaw }] = await Promise.all([
    supabase.from("psychologists").select(
      "id, profile_id, display_name, slug, city, state, crp_number, crp_uf, phone_whatsapp, plan_tier, subscription_status, subscription_period_end, billing_period, coupon_pct, coupon_ends_at, pending_plan_tier, pending_billing_period, trial_tier, trial_ends_at, campaign_voz_granted_at, profile_completed, verification_status, is_published, created_at, asaas_subscription_id, profile_updated_at"
    ),
    supabase.from("plans").select("id, name, price_cents").in("id", ["destaque", "ideal", "presenca"]).order("sort_order"),
    supabase.from("profiles").select("id, email"),
  ]);

  const psys = (psysRaw as Psy[]) ?? [];
  const emailPorProfile = new Map<string, string>(
    ((profilesRaw ?? []) as { id: string; email: string | null }[]).filter((p) => p.email).map((p) => [p.id, p.email as string])
  );
  const precoPlano: Record<string, number> = {};
  for (const p of (plansRaw ?? []) as { id: string; price_cents: number }[]) precoPlano[p.id] = p.price_cents;

  const trialAtivo = (p: Psy) => !!p.trial_ends_at && new Date(p.trial_ends_at) > now;
  const cupomAtivo = (p: Psy) => !!p.coupon_pct && (!p.coupon_ends_at || new Date(p.coupon_ends_at) > now);
  const planoEfetivo = (p: Psy): PlanTier => (trialAtivo(p) ? (p.trial_tier ?? p.plan_tier) : p.plan_tier);
  const emDias = (iso: string) => Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000);
  const desde = (iso: string) => {
    const min = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h}h`;
    const d = Math.floor(h / 24);
    if (d === 1) return "ontem";
    if (d < 7) return `há ${d} dias`;
    return new Date(iso).toLocaleDateString("pt-BR");
  };

  // Receita: MRR com período e cupom aplicados.
  const pagantes = psys.filter((p) => p.subscription_status === "ativa" && p.plan_tier !== "essencial");
  let mrrCents = 0;
  for (const p of pagantes) {
    const base = precoPlano[p.plan_tier] ?? 0;
    const period = p.billing_period === "yearly" ? "yearly" : "monthly";
    const cobrado = chargeCents(base, period, cupomAtivo(p) ? p.coupon_pct : null);
    mrrCents += period === "yearly" ? Math.round(cobrado / 12) : cobrado;
  }
  const arrCents = mrrCents * 12;
  const arpuCents = pagantes.length ? Math.round(mrrCents / pagantes.length) : 0;

  // Estados.
  const atrasadas = psys.filter((p) => p.subscription_status === "atrasada").length;
  const canceladas = psys.filter((p) => p.subscription_status === "cancelada").length;
  const aguardando = psys.filter((p) => p.pending_plan_tier);

  // Testes e campanha.
  const trials = psys.filter(trialAtivo);
  const trials7 = trials.filter((p) => emDias(p.trial_ends_at!) <= 7);
  const cortesiaConcedida = psys.filter((p) => p.campaign_voz_granted_at).length;
  const cortesiaExpirada = psys.filter((p) => p.campaign_voz_granted_at && p.trial_ends_at && new Date(p.trial_ends_at) <= now);
  const cortesiaConvertida = cortesiaExpirada.filter((p) => p.subscription_status === "ativa" && p.plan_tier !== "essencial").length;
  const taxaConversao = cortesiaExpirada.length ? Math.round((cortesiaConvertida / cortesiaExpirada.length) * 100) : null;
  const vozCents = precoPlano["ideal"] ?? 0;
  const potencialCents = trials.length * vozCents;

  // Funil de ativação.
  const total = psys.length;
  const completos = psys.filter((p) => p.profile_completed).length;
  const verificados = psys.filter((p) => p.verification_status === "aprovado").length;
  const publicados = psys.filter((p) => p.is_published).length;

  // Distribuição por plano efetivo.
  const dist: Record<PlanTier, number> = { essencial: 0, destaque: 0, ideal: 0, presenca: 0 };
  for (const p of psys) dist[planoEfetivo(p)]++;

  // Lista de testes a vencer (acionável para conversão).
  const aVencer = [...trials].sort((a, b) => new Date(a.trial_ends_at!).getTime() - new Date(b.trial_ends_at!).getTime()).slice(0, 12);

  // Rastreamento de atividade: quem editou o próprio perfil nos últimos 30 dias,
  // mais recente primeiro.
  const cutoff30 = now.getTime() - 30 * 86_400_000;
  const cutoff7 = now.getTime() - 7 * 86_400_000;
  const atualizacoesRecentes = psys
    .filter((p) => p.profile_updated_at && new Date(p.profile_updated_at).getTime() >= cutoff30)
    .sort((a, b) => new Date(b.profile_updated_at!).getTime() - new Date(a.profile_updated_at!).getTime());
  const ativos7 = atualizacoesRecentes.filter((p) => new Date(p.profile_updated_at!).getTime() >= cutoff7).length;
  const waLink = (tel: string | null) => (tel ? `https://wa.me/${tel.replace(/\D/g, "")}` : null);

  // Grupos detalhados por estado.
  const gAtivos: Psy[] = [], gAguardando: Psy[] = [], gTeste: Psy[] = [], gCortesia: Psy[] = [];
  for (const p of psys) {
    if (p.subscription_status === "ativa" && p.plan_tier !== "essencial") gAtivos.push(p);
    else if (p.pending_plan_tier || p.subscription_status === "atrasada") gAguardando.push(p);
    else if (trialAtivo(p)) gTeste.push(p);
    else if (p.plan_tier !== "essencial") gCortesia.push(p);
  }
  const periodoLabel = (x: string | null) => (x === "yearly" ? "anual" : "mensal");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Assinaturas</h1>
        <p className="mt-1 text-foreground-muted">Painel de receita, planos e testes da base.</p>
      </div>

      {/* RECEITA */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Receita</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<CreditCard className="h-5 w-5" />} tone="brand" label="MRR estimado" value={formatCents(mrrCents)} sub="receita recorrente por mês" />
          <Stat icon={<TrendingUp className="h-5 w-5" />} tone="green" label="ARR projetado" value={formatCents(arrCents)} sub="MRR × 12" />
          <Stat icon={<Wallet className="h-5 w-5" />} label="Ticket médio" value={formatCents(arpuCents)} sub={`${pagantes.length} pagante(s)`} />
          <Stat icon={<Sparkles className="h-5 w-5" />} tone="yellow" label="Potencial dos testes" value={formatCents(potencialCents)} sub={`se os ${trials.length} testes virarem Voz`} />
        </div>
      </section>

      {/* SAÚDE */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Saúde das assinaturas</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} tone="green" label="Pagantes ativas" value={String(pagantes.length)} />
          <Stat icon={<Clock className="h-5 w-5" />} tone="yellow" label="Aguardando pagamento" value={String(aguardando.length)} />
          <Stat icon={<AlertCircle className="h-5 w-5" />} tone="yellow" label="Cobranças atrasadas" value={String(atrasadas)} />
          <Stat icon={<Users className="h-5 w-5" />} label="Canceladas" value={String(canceladas)} />
        </div>
      </section>

      {/* DISTRIBUIÇÃO + FUNIL */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Distribuição por plano</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">Plano efetivo, contando o teste como Voz.</p>
          <div className="mt-4 space-y-3">
            {PLANOS.map((t) => (
              <Bar key={t} label={PLAN_LABEL[t]} count={dist[t]} total={total} color={PLAN_COLOR[t]} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Funil de ativação</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">Do cadastro ao pagamento. A taxa é sobre o total da base.</p>
          <div className="mt-4 space-y-2.5">
            <Funil label="Cadastrados" count={total} base={total} color="#9AA8A4" />
            <Funil label="Perfil completo" count={completos} base={total} color="#53C4CC" />
            <Funil label="Verificados" count={verificados} base={total} color="#5AA0A6" />
            <Funil label="Publicados" count={publicados} base={total} color="#73A533" />
            <Funil label="Pagantes" count={pagantes.length} base={total} color="#05474A" />
          </div>
        </section>
      </div>

      {/* CAMPANHA / TESTES */}
      <section className="rounded-2xl border border-brand/40 bg-brand/5 p-6">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-dark" />
          <h2 className="text-lg">Testes e campanha de reativação</h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-2xl font-semibold text-heading">{trials.length}</p>
            <p className="text-sm text-foreground-muted">Testes ativos agora</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-2xl font-semibold text-yellow-600">{trials7.length}</p>
            <p className="text-sm text-foreground-muted">Vencem em 7 dias</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-2xl font-semibold text-brand-dark">{cortesiaConcedida}</p>
            <p className="text-sm text-foreground-muted">Voz de cortesia concedido</p>
          </div>
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-2xl font-semibold text-green-600">{taxaConversao === null ? "—" : `${taxaConversao}%`}</p>
            <p className="text-sm text-foreground-muted">Conversão após o teste</p>
          </div>
        </div>

        {aVencer.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-heading">Próximos testes a vencer</p>
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <ul className="divide-y divide-border">
                {aVencer.map((p) => {
                  const dias = emDias(p.trial_ends_at!);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        {p.slug ? (
                          <Link href={`/psicologo/${p.slug}`} target="_blank" className="text-sm font-medium text-heading hover:text-brand-dark">{p.display_name || "—"}</Link>
                        ) : (
                          <span className="text-sm font-medium text-heading">{p.display_name || "—"}</span>
                        )}
                        <p className="text-xs text-foreground-muted">Testando {PLAN_LABEL[p.trial_tier ?? "ideal"]}</p>
                      </div>
                      <Badge tone={dias <= 7 ? "warning" : "brand"}>
                        {dias <= 0 ? "vence hoje" : dias === 1 ? "vence amanhã" : `em ${dias} dias`}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <form action={grantTrialAllAction}>
            <ConfirmButton
              message="Conceder 30 dias do plano Voz a TODOS os psicólogos? Isso reinicia o prazo de quem já está em teste."
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              <Gift className="h-4 w-4" /> Conceder 30 dias a todos
            </ConfirmButton>
          </form>
          {trials.length > 0 && (
            <form action={endTrialAllAction}>
              <ConfirmButton
                message="Encerrar o teste de todos agora? Cada perfil volta imediatamente ao plano contratado."
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-danger/40 px-4 text-sm font-medium text-danger hover:bg-danger/10"
              >
                Encerrar teste de todos
              </ConfirmButton>
            </form>
          )}
        </div>
      </section>

      {/* RASTREAMENTO DE ATIVIDADE */}
      <section className="rounded-2xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg">Quem atualizou o perfil · últimos 30 dias</h2>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Atividade real da base. Quem editou o próprio perfil, com os dados completos para você agir.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark">{ativos7} em 7 dias</span>
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-foreground">{atualizacoesRecentes.length} em 30 dias</span>
          </div>
        </div>
        {atualizacoesRecentes.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-muted">
            Ninguém atualizou o perfil nos últimos 30 dias. Quem mexer a partir de agora aparece aqui.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {atualizacoesRecentes.slice(0, 80).map((p) => {
              const emTeste = trialAtivo(p);
              const efetivo = planoEfetivo(p);
              const email = emailPorProfile.get(p.profile_id);
              const wa = waLink(p.phone_whatsapp);
              const local = [p.city, p.state].filter(Boolean).join(" / ");
              const crp = p.crp_number ? `CRP ${p.crp_number}${p.crp_uf ? `/${p.crp_uf}` : ""}` : "sem CRP";
              return (
                <li key={p.id} className="px-6 py-4 hover:bg-surface-muted/40">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Nome + status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/usuarios/${p.profile_id}`} className="font-medium text-heading hover:text-brand-dark hover:underline">
                          {p.display_name || "—"}
                        </Link>
                        <Badge tone={emTeste ? "brand" : efetivo === "essencial" ? "neutral" : "success"}>
                          {PLAN_LABEL[efetivo]}{emTeste ? " · teste" : ""}
                        </Badge>
                        <Badge tone={p.verification_status === "aprovado" ? "success" : p.verification_status === "pendente" ? "warning" : "neutral"}>
                          {p.verification_status === "aprovado" ? "verificado" : p.verification_status === "pendente" ? "na fila" : "sem verificação"}
                        </Badge>
                        <Badge tone={p.is_published ? "success" : "neutral"}>{p.is_published ? "publicado" : "não publicado"}</Badge>
                        {!p.profile_completed && <Badge tone="warning">incompleto</Badge>}
                        {p.campaign_voz_granted_at && <Badge tone="brand">cortesia Voz</Badge>}
                      </div>
                      {/* Contato e dados */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
                        {email && <span>{email}</span>}
                        {p.phone_whatsapp && (
                          wa ? <a href={wa} target="_blank" className="text-brand-dark hover:underline">{p.phone_whatsapp}</a> : <span>{p.phone_whatsapp}</span>
                        )}
                        {local && <span>{local}</span>}
                        <span>{crp}</span>
                      </div>
                      {/* Datas */}
                      <div className="mt-1 text-xs text-foreground-muted">
                        Atualizou <strong className="text-foreground">{desde(p.profile_updated_at!)}</strong>
                        {p.created_at && <> · cadastrou em {new Date(p.created_at).toLocaleDateString("pt-BR")}</>}
                        {emTeste && p.trial_ends_at && <> · teste até {new Date(p.trial_ends_at).toLocaleDateString("pt-BR")}</>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {p.slug && p.is_published && (
                        <Link href={`/psicologo/${p.slug}`} target="_blank" className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-surface-muted">
                          Ver perfil
                        </Link>
                      )}
                      <Link href={`/admin/usuarios/${p.profile_id}`} className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-medium hover:bg-surface-muted">
                        Gerenciar
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
            {atualizacoesRecentes.length > 80 && (
              <li className="px-6 py-3 text-center text-xs text-foreground-muted">
                e mais {atualizacoesRecentes.length - 80} nos últimos 30 dias — veja todos em{" "}
                <Link href="/admin/usuarios" className="font-medium underline">Usuários</Link>
              </li>
            )}
          </ul>
        )}
      </section>

      {/* PREÇOS */}
      <PlanPriceEditor plans={(plansRaw as { id: string; name: string; price_cents: number }[]) ?? []} />

      {/* GRUPOS DETALHADOS */}
      <div className="space-y-6">
        <Grupo
          titulo="Pagantes ativos" descricao="Pagamento confirmado no Asaas. Geram receita." rows={gAtivos}
          plano={(r) => `${PLAN_LABEL[r.plan_tier]} · ${periodoLabel(r.billing_period)}${cupomAtivo(r) ? ` · cupom -${r.coupon_pct}%` : ""}`}
          badge={() => ({ tone: "success", label: "Ativa" })}
          vazio="Ninguém pagante ainda."
        />
        <Grupo
          titulo="Aguardando pagamento" descricao="Assinaram e a cobrança foi emitida, mas o pagamento não confirmou." rows={gAguardando}
          plano={(r) => r.pending_plan_tier ? `Quer ${PLAN_LABEL[r.pending_plan_tier]} · ${periodoLabel(r.pending_billing_period)}` : `${PLAN_LABEL[r.plan_tier]} · cobrança vencida`}
          badge={() => ({ tone: "warning", label: "Aguardando" })}
          vazio="Ninguém aguardando pagamento."
        />
        <Grupo
          titulo="Em teste gratuito" descricao="Usando os recursos do plano de graça. Vencido o teste, voltam ao contratado." rows={gTeste}
          plano={(r) => `Testando ${PLAN_LABEL[r.trial_tier ?? "ideal"]}${r.trial_ends_at ? ` até ${new Date(r.trial_ends_at).toLocaleDateString("pt-BR")}` : ""}`}
          badge={() => ({ tone: "brand", label: "Teste" })}
          vazio="Ninguém em teste agora."
        />
        <Grupo
          titulo="Cortesia / manual" descricao="Plano pago atribuído na mão, sem cobrança no Asaas." rows={gCortesia}
          plano={(r) => `${PLAN_LABEL[r.plan_tier]} · sem cobrança`}
          badge={() => ({ tone: "neutral", label: "Manual" })}
          vazio="Nenhum plano atribuído manualmente."
        />
      </div>

      {/* STATUS ASAAS */}
      {!isAsaasConfigured() ? (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-500/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Cobrança recorrente desligada: falta a variável <code className="mx-1">ASAAS_API_KEY</code>. Os planos pagos são atribuídos em modo de teste.
            <Link href="/admin/integracoes" className="ml-1 font-medium underline">Ver diagnóstico</Link>
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-foreground-muted">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>
            Cobrança recorrente ligada no Asaas <strong className="mx-1 text-heading">{asaasEnv() === "production" ? "produção" : "sandbox"}</strong>.
            {mrrCents === 0 && " Ainda não há pagamento confirmado, por isso o faturamento está zerado."}
            <Link href="/admin/integracoes" className="ml-1 font-medium underline">Testar conexão</Link>
          </span>
        </div>
      )}
    </div>
  );
}

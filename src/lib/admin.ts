import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PlanTier,
  VerificationStatus,
  SubscriptionStatus,
} from "@/lib/types";

export type AdminMetrics = {
  psicologos: {
    total: number;
    publicados: number;
    rascunhos: number;
    incompletos: number;
    novos30d: number;
  };
  verificacao: Record<VerificationStatus, number>;
  planos: Record<PlanTier, number>;
  assinaturas: {
    ativas: number;
    atrasadas: number;
    canceladas: number;
    mrrCents: number;
  };
  conteudo: {
    artigosPublicados: number;
    perguntasPendentes: number;
    respostasPendentes: number;
    perguntasPublicadas: number;
  };
  admins: number;
};

const ZERO_VERIF: Record<VerificationStatus, number> = {
  nao_enviado: 0,
  pendente: 0,
  aprovado: 0,
  reprovado: 0,
};
const ZERO_PLAN: Record<PlanTier, number> = {
  essencial: 0,
  destaque: 0,
  ideal: 0,
  presenca: 0,
};

export async function getMetrics(): Promise<AdminMetrics> {
  const supabase = createAdminClient();

  const [{ data: psys }, { data: plans }, artigos, perguntasPend, respostasPend, perguntasPub, admins] =
    await Promise.all([
      supabase
        .from("psychologists")
        .select("plan_tier, is_published, verification_status, subscription_status, created_at, profile_completed"),
      supabase.from("plans").select("id, price_cents"),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
      supabase.from("forum_questions").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("forum_answers").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("forum_questions").select("*", { count: "exact", head: true }).eq("status", "publicada"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    ]);

  const priceById: Record<string, number> = Object.fromEntries(
    (plans ?? []).map((p) => [p.id, p.price_cents])
  );

  const verificacao = { ...ZERO_VERIF };
  const planos = { ...ZERO_PLAN };
  const assinaturas = { ativas: 0, atrasadas: 0, canceladas: 0, mrrCents: 0 };
  let publicados = 0;
  let incompletos = 0;
  let novos30d = 0;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const p of psys ?? []) {
    verificacao[p.verification_status as VerificationStatus]++;
    planos[p.plan_tier as PlanTier]++;
    if (p.is_published) publicados++;
    if (!p.profile_completed) incompletos++;
    if (p.created_at && new Date(p.created_at).getTime() >= cutoff) novos30d++;

    const sub = p.subscription_status as SubscriptionStatus;
    if (sub === "ativa") {
      assinaturas.ativas++;
      assinaturas.mrrCents += priceById[p.plan_tier] ?? 0;
    } else if (sub === "atrasada") assinaturas.atrasadas++;
    else if (sub === "cancelada") assinaturas.canceladas++;
  }

  const total = psys?.length ?? 0;

  return {
    psicologos: { total, publicados, rascunhos: total - publicados, incompletos, novos30d },
    verificacao,
    planos,
    assinaturas,
    conteudo: {
      artigosPublicados: artigos.count ?? 0,
      perguntasPendentes: perguntasPend.count ?? 0,
      respostasPendentes: respostasPend.count ?? 0,
      perguntasPublicadas: perguntasPub.count ?? 0,
    },
    admins: admins.count ?? 0,
  };
}

export type AdminUser = {
  psyId: string | null;
  profileId: string;
  name: string | null;
  email: string | null;
  role: "psicologo" | "admin";
  slug: string | null;
  city: string | null;
  plan: PlanTier | null;
  verification: VerificationStatus | null;
  published: boolean;
  profileCompleted: boolean;
  subscription: SubscriptionStatus | null;
  createdAt: string | null;
};

export type UserDetail = {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: "psicologo" | "admin";
    created_at: string | null;
  };
  psy: Record<string, unknown> | null;
};

/** Detalhe completo de um usuário (perfil + linha do psicólogo) para a página de gestão. */
export async function getUserDetail(profileId: string): Promise<UserDetail | null> {
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) return null;

  const { data: psy } = await supabase
    .from("psychologists")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  return { profile: profile as UserDetail["profile"], psy: (psy as Record<string, unknown>) ?? null };
}

/** Todos os perfis com dados do psicólogo (join manual p/ evitar ambiguidade de FK). */
export async function getUsersOverview(): Promise<AdminUser[]> {
  const supabase = createAdminClient();
  const [{ data: profiles }, { data: psys }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role, created_at").order("created_at", { ascending: false }),
    supabase
      .from("psychologists")
      .select("id, profile_id, slug, city, plan_tier, verification_status, is_published, subscription_status, profile_completed"),
  ]);

  const psyByProfile = new Map((psys ?? []).map((p) => [p.profile_id, p]));

  return (profiles ?? []).map((pr) => {
    const psy = psyByProfile.get(pr.id);
    return {
      psyId: psy?.id ?? null,
      profileId: pr.id,
      name: pr.full_name,
      email: pr.email,
      role: pr.role,
      slug: psy?.slug ?? null,
      city: psy?.city ?? null,
      plan: (psy?.plan_tier as PlanTier) ?? null,
      verification: (psy?.verification_status as VerificationStatus) ?? null,
      published: psy?.is_published ?? false,
      profileCompleted: psy?.profile_completed ?? false,
      subscription: (psy?.subscription_status as SubscriptionStatus) ?? null,
      createdAt: pr.created_at,
    };
  });
}

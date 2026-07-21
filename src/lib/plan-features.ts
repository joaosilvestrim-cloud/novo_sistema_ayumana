import type { PlanTier } from "@/lib/types";

// Fonte ÚNICA do que cada plano libera. Quando o Asaas mudar o plan_tier do
// psicólogo, todo o site passa a respeitar estes limites automaticamente.
export const PLAN_RANK: Record<PlanTier, number> = {
  essencial: 0,
  destaque: 1,
  ideal: 2,
  presenca: 3,
};

export type PlanFeature =
  | "showPrice" // exibir valor da sessão
  | "agendaAberta" // selo "aceitando novos pacientes"
  | "searchPriority" // aparece acima dos gratuitos
  | "searchTopPriority" // topo, acima dos demais pagos
  | "video" // vídeo de apresentação
  | "exteriorDestaque" // selo de exterior em destaque
  | "forum"; // responder no fórum

// Plano mínimo que libera cada recurso (bate 1:1 com o "Compare os planos").
const FEATURE_MIN: Record<PlanFeature, PlanTier> = {
  showPrice: "destaque",
  agendaAberta: "destaque",
  searchPriority: "destaque",
  searchTopPriority: "ideal",
  video: "ideal",
  exteriorDestaque: "ideal",
  forum: "ideal",
};

export function planAtLeast(tier: PlanTier, min: PlanTier): boolean {
  return (PLAN_RANK[tier] ?? 0) >= (PLAN_RANK[min] ?? 0);
}

/** Dados mínimos para calcular o plano que vale agora. */
export type PlanSource = {
  plan_tier: PlanTier;
  trial_tier?: PlanTier | null;
  trial_ends_at?: string | null;
};

/** Teste gratuito ainda válido? */
export function trialAtivo(p: PlanSource): boolean {
  if (!p.trial_tier || !p.trial_ends_at) return false;
  return new Date(p.trial_ends_at).getTime() > Date.now();
}

/** Dias restantes do teste (0 se não houver). */
export function trialDiasRestantes(p: PlanSource): number {
  if (!trialAtivo(p)) return 0;
  const ms = new Date(p.trial_ends_at!).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * Plano que vale AGORA. Se o teste estiver no prazo e for melhor que o
 * contratado, ele prevalece. Quando expira, volta sozinho ao contratado.
 */
export function effectivePlan(p: PlanSource): PlanTier {
  if (trialAtivo(p) && planAtLeast(p.trial_tier!, p.plan_tier)) return p.trial_tier!;
  return p.plan_tier;
}

export function planHas(tier: PlanTier | null | undefined, feature: PlanFeature): boolean {
  if (!tier) return false;
  return planAtLeast(tier, FEATURE_MIN[feature]);
}

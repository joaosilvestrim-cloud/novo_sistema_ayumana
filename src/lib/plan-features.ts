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

export function planHas(tier: PlanTier | null | undefined, feature: PlanFeature): boolean {
  if (!tier) return false;
  return planAtLeast(tier, FEATURE_MIN[feature]);
}

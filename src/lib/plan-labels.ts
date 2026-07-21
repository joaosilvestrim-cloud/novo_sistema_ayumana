import type { PlanTier } from "@/lib/types";

/**
 * Nomes visíveis dos planos. Os identificadores internos (essencial, destaque,
 * ideal, presenca) continuam os mesmos no banco — só o rótulo muda.
 * Narrativa: "Crie raiz. Ganhe alcance. Tenha voz. Construa presença."
 */
export const PLAN_LABEL: Record<PlanTier, string> = {
  essencial: "Raiz",
  destaque: "Alcance",
  ideal: "Voz",
  presenca: "Presença",
};

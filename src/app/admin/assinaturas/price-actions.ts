"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCents } from "@/lib/pricing";

// Só os planos pagos têm preço editável. O Raiz é sempre grátis.
const EDITAVEIS = ["destaque", "ideal", "presenca"];

/**
 * Atualiza o preço de um plano. Mexe nos dois campos juntos: o price_cents
 * (que cobra e calcula) e o price_label (o texto dos cards), para nunca
 * descasarem. Vale para novas assinaturas; quem já paga continua no valor
 * que contratou no Asaas.
 */
export async function updatePlanPriceAction(
  planId: string,
  priceReais: number
): Promise<{ ok: boolean; msg: string }> {
  await requireAdmin();

  if (!EDITAVEIS.includes(planId)) {
    return { ok: false, msg: "Este plano não tem preço editável." };
  }
  if (!Number.isFinite(priceReais) || priceReais < 0 || priceReais > 100000) {
    return { ok: false, msg: "Valor inválido. Use um número em reais." };
  }

  const cents = Math.round(priceReais * 100);
  const label = cents === 0 ? "Grátis" : `${formatCents(cents)}/mês`;

  const admin = createAdminClient();
  const { error } = await admin
    .from("plans")
    .update({ price_cents: cents, price_label: label })
    .eq("id", planId);

  if (error) {
    return { ok: false, msg: "Não foi possível salvar. Tente de novo." };
  }

  // Todas as telas que mostram ou usam o preço.
  revalidatePath("/admin/assinaturas");
  revalidatePath("/para-psicologos");
  revalidatePath("/painel/assinatura");
  revalidatePath("/painel/ajuda");
  revalidatePath("/psicologos");

  return { ok: true, msg: `Preço salvo: ${formatCents(cents)}/mês.` };
}

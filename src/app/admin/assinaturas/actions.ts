"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DIAS = 30;
const TIER = "ideal"; // plano "Voz"

/** Concede o teste gratuito do Voz por 30 dias a todos os psicólogos. */
export async function grantTrialAllAction() {
  await requireAdmin();
  const admin = createAdminClient();
  const fim = new Date();
  fim.setDate(fim.getDate() + DIAS);

  await admin
    .from("psychologists")
    .update({
      trial_tier: TIER,
      trial_ends_at: fim.toISOString(),
      trial_notified_7: false,
      trial_notified_1: false,
    })
    .not("id", "is", null);

  revalidatePath("/admin/assinaturas");
  revalidatePath("/psicologos");
}

/** Encerra o teste de todos (volta ao plano contratado imediatamente). */
export async function endTrialAllAction() {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("psychologists")
    .update({ trial_tier: null, trial_ends_at: null })
    .not("trial_ends_at", "is", null);

  revalidatePath("/admin/assinaturas");
  revalidatePath("/psicologos");
}

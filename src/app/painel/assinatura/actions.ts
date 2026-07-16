"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SELF_SERVICE = ["essencial", "destaque", "ideal"];

export async function selectPlanAction(formData: FormData) {
  const plan = String(formData.get("plan") ?? "");
  if (!SELF_SERVICE.includes(plan)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Fase 3 integrará pagamento; por ora troca direta.
  await supabase
    .from("psychologists")
    .update({ plan_tier: plan })
    .eq("profile_id", user.id);

  revalidatePath("/painel/assinatura");
  revalidatePath("/painel");
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrialEnding } from "@/lib/email";
import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Avisa quem está com teste gratuito acabando (7 dias antes e 1 dia antes).
 * Chamado por cron diário da Vercel. As colunas trial_notified_* garantem que
 * cada aviso saia uma única vez, mesmo se o cron rodar de novo.
 */
export async function GET(request: NextRequest) {
  // A Vercel envia "Authorization: Bearer <CRON_SECRET>" quando a env existe.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const agora = Date.now();

  const { data, error } = await admin
    .from("psychologists")
    .select("id, profile_id, display_name, trial_tier, trial_ends_at, trial_notified_7, trial_notified_1")
    .not("trial_ends_at", "is", null)
    .gt("trial_ends_at", new Date(agora).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    profile_id: string;
    display_name: string | null;
    trial_tier: PlanTier | null;
    trial_ends_at: string;
    trial_notified_7: boolean;
    trial_notified_1: boolean;
  };

  let enviados7 = 0;
  let enviados1 = 0;

  for (const p of ((data ?? []) as Row[])) {
    const dias = Math.ceil((new Date(p.trial_ends_at).getTime() - agora) / 86_400_000);
    const marca =
      dias <= 1 && !p.trial_notified_1 ? "trial_notified_1"
      : dias <= 7 && !p.trial_notified_7 ? "trial_notified_7"
      : null;
    if (!marca) continue;

    // E-mail do profissional fica no profile.
    const { data: prof } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", p.profile_id)
      .maybeSingle();
    const email = prof?.email;
    if (!email) continue;

    const plano = p.trial_tier ? PLAN_LABEL[p.trial_tier] : "Voz";
    const ok = await sendTrialEnding(email, prof?.full_name ?? p.display_name, dias, plano);
    if (!ok) continue;

    await admin.from("psychologists").update({ [marca]: true }).eq("id", p.id);
    if (marca === "trial_notified_1") enviados1++;
    else enviados7++;
  }

  return NextResponse.json({ ok: true, enviados7, enviados1 });
}

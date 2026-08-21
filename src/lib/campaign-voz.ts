import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVozCortesia } from "@/lib/email";

const TRIAL_DAYS = 90;
// Fim da janela da cortesia: quem COMPLETAR o perfil até esta data ganha os 90
// dias. Padrão = fim do dia 21/09/2026 no horário de Brasília. Sobrescreva pela
// env CAMPAIGN_VOZ_DEADLINE se mudar a vigência.
const DEFAULT_DEADLINE = "2026-09-22T00:00:00-03:00";

export function campaignDeadline(): Date {
  const raw = process.env.CAMPAIGN_VOZ_DEADLINE || DEFAULT_DEADLINE;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date(DEFAULT_DEADLINE) : d;
}

type Row = {
  id: string;
  profile_id: string;
  display_name: string | null;
  plan_tier: string;
  verification_status: string | null;
  profile_completed: boolean | null;
  campaign_voz_granted_at: string | null;
  profile_updated_at: string | null;
};

/**
 * Concede 90 dias do plano Voz de cortesia quando o psicólogo completa o perfil
 * com CRP aprovado, dentro da janela da campanha de reativação.
 *
 * É idempotente: só concede uma vez (campaign_voz_granted_at) e usa um guard
 * atômico contra corrida (o completar do perfil e a aprovação do admin podem
 * disparar quase juntos). Nunca lança erro, para não quebrar o fluxo que chamou.
 *
 * Retorna true só quando de fato concedeu agora.
 */
export async function grantCampaignVoz(psyId: string): Promise<boolean> {
  try {
    if (!psyId) return false;

    const admin = createAdminClient();
    const { data } = await admin
      .from("psychologists")
      .select("id, profile_id, display_name, plan_tier, verification_status, profile_completed, campaign_voz_granted_at, profile_updated_at")
      .eq("id", psyId)
      .maybeSingle();
    const psy = data as Row | null;
    if (!psy) return false;

    // Elegibilidade: perfil completo, CRP aprovado, ainda no plano gratuito,
    // sem cortesia concedida antes.
    if (psy.campaign_voz_granted_at) return false;
    if (psy.plan_tier !== "essencial") return false;
    if (!psy.profile_completed) return false;
    if (psy.verification_status !== "aprovado") return false;

    // Janela da campanha: vale se AGORA está no prazo, OU se a pessoa completou
    // o perfil dentro do prazo. Isso protege quem entrou a tempo (segmento sem
    // CRP) mas foi aprovado pelo admin só depois da data limite.
    const deadline = campaignDeadline();
    const completouNoPrazo = !!psy.profile_updated_at && new Date(psy.profile_updated_at) <= deadline;
    if (new Date() > deadline && !completouNoPrazo) return false;

    const fim = new Date();
    fim.setDate(fim.getDate() + TRIAL_DAYS);

    // O .is(...null) garante que só um caminho concede, mesmo em corrida.
    const { data: updated, error } = await admin
      .from("psychologists")
      .update({
        trial_tier: "ideal",
        trial_ends_at: fim.toISOString(),
        trial_notified_7: false,
        trial_notified_1: false,
        campaign_voz_granted_at: new Date().toISOString(),
      })
      .eq("id", psyId)
      .is("campaign_voz_granted_at", null)
      .select("id");
    if (error || !updated || updated.length === 0) return false;

    // E-mail E4 de boas-vindas. Falha de e-mail não desfaz a concessão.
    const { data: prof } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", psy.profile_id)
      .maybeSingle();
    if (prof?.email) {
      await sendVozCortesia(prof.email as string, (prof.full_name as string) ?? psy.display_name);
    }
    return true;
  } catch {
    return false;
  }
}

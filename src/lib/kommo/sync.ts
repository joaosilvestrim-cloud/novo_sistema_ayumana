import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isKommoConfigured, stageId, createLeadWithContact, moveLead, addLeadNote,
  type KommoStageKey,
} from "@/lib/kommo/client";

const NOTA: Record<KommoStageKey, string> = {
  cadastro: "Novo cadastro de psicólogo na Ayumana.",
  teste: "Iniciou o teste gratuito do plano Voz.",
  compra: "Pagamento confirmado. Assinatura ativa.",
  cancelado: "Assinatura cancelada.",
};

/**
 * Envia um evento do psicólogo para o Kommo, movendo o lead pela etapa certa.
 * Best-effort: qualquer falha é engolida para não quebrar compra, cadastro etc.
 * O Kommo cuida das notificações (WhatsApp) pela automação de etapa.
 */
export async function syncKommo(
  psyId: string,
  event: KommoStageKey,
  extra?: { note?: string; priceReais?: number; onlyIfNew?: boolean }
): Promise<void> {
  if (!isKommoConfigured()) return;
  const status = stageId(event);
  if (!status) return; // etapa não configurada para este evento

  try {
    const admin = createAdminClient();
    const { data: psy } = await admin
      .from("psychologists")
      .select("id, display_name, profile_id, phone_whatsapp, kommo_lead_id")
      .eq("id", psyId)
      .maybeSingle();
    if (!psy) return;

    // "cadastro" só cria o lead. Se ele já existe e avançou no funil, não
    // voltamos a etapa (evita regredir um cliente que já comprou).
    if (extra?.onlyIfNew && psy.kommo_lead_id) return;

    const { data: prof } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", psy.profile_id)
      .maybeSingle();

    const nome = (psy.display_name as string) || (prof?.full_name as string) || (prof?.email as string) || "Psicólogo";
    const nota = extra?.note ?? NOTA[event];

    if (psy.kommo_lead_id) {
      // Já existe lead: só move de etapa e registra a nota.
      await moveLead(psy.kommo_lead_id as string, status, extra?.priceReais);
      await addLeadNote(psy.kommo_lead_id as string, nota);
    } else {
      // Primeiro contato: cria lead + contato e guarda os ids.
      const { leadId, contactId } = await createLeadWithContact({
        name: `Ayumana · ${nome}`,
        price: extra?.priceReais,
        statusId: status,
        contact: {
          name: nome,
          email: (prof?.email as string) ?? null,
          phone: (psy.phone_whatsapp as string) ?? null,
        },
      });
      await admin
        .from("psychologists")
        .update({ kommo_lead_id: leadId, kommo_contact_id: contactId })
        .eq("id", psyId);
      if (nota) await addLeadNote(leadId, nota);
    }
  } catch {
    // integração é acessória: nunca derruba o fluxo de negócio
  }
}

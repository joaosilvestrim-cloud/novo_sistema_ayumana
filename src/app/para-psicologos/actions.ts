"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type WaitlistState = { ok: boolean; error: string | null; jaInscrito?: boolean };

/**
 * Inscreve alguém na fila do plano Presença. Se estiver logado como psicólogo,
 * puxa os dados do perfil e não duplica. Se não, usa o formulário público.
 * A gravação passa pela chave de serviço, então não depende de RLS de insert.
 */
export async function joinPresencaWaitlistAction(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let name = String(formData.get("name") ?? "").trim();
  let email = String(formData.get("email") ?? "").trim().toLowerCase();
  let phone = String(formData.get("phone") ?? "").replace(/\D/g, "");
  const note = String(formData.get("note") ?? "").trim() || null;
  let city: string | null = null;
  let crp: string | null = null;
  let psychologistId: string | null = null;

  if (user) {
    const { data: prof } = await admin
      .from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
    const { data: psy } = await admin
      .from("psychologists")
      .select("id, display_name, phone_whatsapp, city, state, crp_number, crp_uf")
      .eq("profile_id", user.id).maybeSingle();
    email = email || (prof?.email as string) || user.email || "";
    if (psy) {
      psychologistId = psy.id as string;
      // Já está na fila? Não duplica.
      const { data: existente } = await admin
        .from("presenca_waitlist")
        .select("id").eq("psychologist_id", psy.id)
        .in("status", ["pendente", "contatado", "aprovado"]).maybeSingle();
      if (existente) return { ok: true, error: null, jaInscrito: true };
      name = name || (psy.display_name as string) || (prof?.full_name as string) || "";
      phone = phone || ((psy.phone_whatsapp as string) ?? "");
      city = [psy.city, psy.state].filter(Boolean).join(" / ") || null;
      crp = psy.crp_number ? `${psy.crp_number}${psy.crp_uf ? `/${psy.crp_uf}` : ""}` : null;
    }
  }

  if (!name || !email.includes("@")) {
    return { ok: false, error: "Informe seu nome e um e-mail válido." };
  }

  const { error } = await admin.from("presenca_waitlist").insert({
    psychologist_id: psychologistId,
    name,
    email,
    phone: phone || null,
    city,
    crp,
    note,
  });
  if (error) return { ok: false, error: "Não foi possível registrar agora. Tente de novo." };

  return { ok: true, error: null };
}

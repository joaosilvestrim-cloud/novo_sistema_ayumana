"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import type { Audience } from "@/lib/types";

const BUCKET = process.env.SUPABASE_CRP_BUCKET || "crp-documentos";

export type OnboardingState = { error: string | null; ok?: boolean };

function toCents(value: string): number | null {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(".", "").replace(",", ".");
  const n = Number(cleaned);
  if (!value.trim() || Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

export async function saveOnboardingAction(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const intent = String(formData.get("intent") ?? "save"); // "save" | "submit"
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  // Garante que a linha do psicólogo existe.
  const { data: existing } = await supabase
    .from("psychologists")
    .select("id, crp_document_path")
    .eq("profile_id", user.id)
    .maybeSingle();

  let psyId = existing?.id as string | undefined;
  if (!psyId) {
    const { data: inserted, error: insErr } = await supabase
      .from("psychologists")
      .insert({ profile_id: user.id })
      .select("id")
      .single();
    if (insErr || !inserted) {
      return { error: "Não foi possível iniciar seu perfil. Rode as migrations do banco." };
    }
    psyId = inserted.id;
  }
  if (!psyId) {
    return { error: "Não foi possível identificar seu perfil." };
  }

  // Campos do formulário.
  const displayName = String(formData.get("display_name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim() || null;
  const crpNumber = String(formData.get("crp_number") ?? "").trim();
  const crpUf = String(formData.get("crp_uf") ?? "").trim().toUpperCase() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const phone = String(formData.get("phone_whatsapp") ?? "").replace(/\D/g, "") || null;
  const sessionPrice = toCents(String(formData.get("session_price") ?? ""));
  const acceptsOnline = formData.get("accepts_online") === "on";
  const acceptsInPerson = formData.get("accepts_in_person") === "on";
  const attendsAbroad = formData.get("attends_abroad") === "on";

  const audiences = (formData.getAll("audiences") as string[]).filter(Boolean) as Audience[];
  const languagesRaw = String(formData.get("languages") ?? "pt");
  const languages = languagesRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const timezones = String(formData.get("timezones") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const approachIds = (formData.getAll("approaches") as string[])
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  const specialtyIds = (formData.getAll("specialties") as string[])
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
  const countryCodes = (formData.getAll("countries") as string[]).filter(Boolean);

  // Upload do documento de CRP (opcional).
  let crpDocumentPath = existing?.crp_document_path ?? null;
  const file = formData.get("crp_document") as File | null;
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return { error: "O documento excede 10 MB." };
    }
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
    const path = `${user.id}/crp-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      return { error: `Falha no upload do documento: ${upErr.message}` };
    }
    crpDocumentPath = path;
  }

  // Validação para envio à verificação.
  if (intent === "submit") {
    if (!displayName || !crpNumber || !crpUf) {
      return { error: "Preencha nome de exibição, número e UF do CRP." };
    }
    if (!crpDocumentPath) {
      return { error: "Envie o documento do CRP para solicitar a verificação." };
    }
    if (!headline || !bio) {
      return { error: "Preencha o título e a apresentação do perfil." };
    }
  }

  const profileCompleted =
    !!displayName && !!crpNumber && !!crpUf && !!headline && !!bio && !!crpDocumentPath;

  const slug = displayName
    ? `${slugify(displayName)}-${psyId.slice(0, 6)}`
    : null;

  const update: Record<string, unknown> = {
    display_name: displayName || null,
    slug,
    headline: headline || null,
    bio: bio || null,
    gender,
    crp_number: crpNumber || null,
    crp_uf: crpUf,
    crp_document_path: crpDocumentPath,
    city,
    state,
    phone_whatsapp: phone,
    session_price_cents: sessionPrice,
    accepts_online: acceptsOnline,
    accepts_in_person: acceptsInPerson,
    attends_abroad: attendsAbroad,
    audiences: audiences.length ? audiences : ["adulto"],
    languages: languages.length ? languages : ["pt"],
    timezones,
    profile_completed: profileCompleted,
  };

  // Solicita verificação: nao_enviado/reprovado -> pendente (o trigger valida).
  if (intent === "submit") {
    update.verification_status = "pendente";
  }

  const { error: updErr } = await supabase
    .from("psychologists")
    .update(update)
    .eq("id", psyId);
  if (updErr) {
    return { error: `Não foi possível salvar: ${updErr.message}` };
  }

  // Sincroniza joins (substitui tudo).
  await supabase.from("psychologist_approaches").delete().eq("psychologist_id", psyId);
  if (approachIds.length) {
    await supabase
      .from("psychologist_approaches")
      .insert(approachIds.map((approach_id) => ({ psychologist_id: psyId, approach_id })));
  }

  await supabase.from("psychologist_specialties").delete().eq("psychologist_id", psyId);
  if (specialtyIds.length) {
    await supabase
      .from("psychologist_specialties")
      .insert(specialtyIds.map((specialty_id) => ({ psychologist_id: psyId, specialty_id })));
  }

  await supabase.from("psychologist_countries").delete().eq("psychologist_id", psyId);
  if (attendsAbroad && countryCodes.length) {
    await supabase
      .from("psychologist_countries")
      .insert(countryCodes.map((country_code) => ({ psychologist_id: psyId, country_code })));
  }

  revalidatePath("/painel");
  if (intent === "submit") {
    redirect("/painel?enviado=1");
  }
  return { error: null, ok: true };
}

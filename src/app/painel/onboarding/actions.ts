"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { verificarCrpNoCfp } from "@/lib/crp/verify";
import type { Audience } from "@/lib/types";

const BUCKET = process.env.SUPABASE_CRP_BUCKET || "crp-documentos";

export type OnboardingState = { error: string | null; ok?: boolean };

// Sanitiza o HTML do editor rico: só permite as tags que o editor gera e
// remove atributos perigosos (on*, javascript:). Defesa contra HTML malicioso
// postado direto no server action.
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3",
  "ul", "ol", "li", "blockquote", "a", "code", "pre",
]);
function sanitizeHtml(html: string): string {
  if (!html) return "";
  let out = html.replace(/<(script|style|iframe|object|embed|noscript)[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (_m, slash, tag, attrs) => {
    const t = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return "";
    if (slash === "/") return `</${t}>`;
    if (t === "a") {
      const m = String(attrs).match(/href\s*=\s*"([^"]*)"/i) || String(attrs).match(/href\s*=\s*'([^']*)'/i);
      const url = m ? m[1] : "";
      if (/^(https?:|mailto:)/i.test(url)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer nofollow">`;
      }
      return "<a>";
    }
    return `<${t}>`;
  });
  return out;
}

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
  // Bio agora é HTML (editor rico). Considera vazio se não sobrar texto.
  const bioEmpty = !bio || bio.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
  const gender = String(formData.get("gender") ?? "").trim() || null;
  const crpNumber = String(formData.get("crp_number") ?? "").trim();
  const crpUf = String(formData.get("crp_uf") ?? "").trim().toUpperCase() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const phone = String(formData.get("phone_whatsapp") ?? "").replace(/\D/g, "") || null;
  const instagram = String(formData.get("instagram") ?? "").trim().replace(/^@+/, "") || null;
  const sessionPrice = toCents(String(formData.get("session_price") ?? ""));
  const sessionPriceInPerson = toCents(String(formData.get("session_price_in_person") ?? ""));
  const timezone = String(formData.get("timezone") ?? "America/Sao_Paulo").trim() || "America/Sao_Paulo";
  const acceptingPatients = formData.get("accepting_patients") === "on";
  const formationRaw = String(formData.get("formation") ?? "").trim();
  const formationEmpty = !formationRaw || formationRaw.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
  const formation = formationEmpty ? null : sanitizeHtml(formationRaw);
  const services = String(formData.get("services") ?? "")
    .split(/[\n,;]/)
    .map((x) => x.trim())
    .filter(Boolean);
  let schedule: unknown = null;
  try {
    const raw = String(formData.get("schedule") ?? "");
    if (raw) schedule = JSON.parse(raw);
  } catch {
    schedule = null;
  }
  let style: unknown = null;
  try {
    const raw = String(formData.get("style") ?? "");
    if (raw) style = JSON.parse(raw);
  } catch {
    style = null;
  }
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

  // Upload da foto de perfil (opcional, bucket público via admin).
  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar_file") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 5 * 1024 * 1024) {
      return { error: "A foto excede 5 MB." };
    }
    const admin = createAdminClient();
    const ext = (avatarFile.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/perfil-${Date.now()}.${ext}`;
    const { error: avErr } = await admin.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (avErr) {
      return { error: `Falha no upload da foto: ${avErr.message}` };
    }
    avatarUrl = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  // Galeria: mantém as URLs existentes que o usuário não removeu + sobe as novas.
  const keptGallery = (formData.getAll("gallery_existing") as string[]).filter(Boolean);
  const galleryFiles = (formData.getAll("gallery_files") as File[]).filter((f) => f && f.size > 0);
  const newGalleryUrls: string[] = [];
  if (galleryFiles.length) {
    const admin = createAdminClient();
    for (let i = 0; i < galleryFiles.length; i++) {
      const f = galleryFiles[i];
      if (f.size > 5 * 1024 * 1024) {
        return { error: "Cada foto da galeria deve ter até 5 MB." };
      }
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/galeria-${Date.now()}-${i}.${ext}`;
      const { error: gErr } = await admin.storage
        .from("avatars")
        .upload(path, f, { upsert: true, contentType: f.type });
      if (gErr) {
        return { error: `Falha no upload da galeria: ${gErr.message}` };
      }
      newGalleryUrls.push(admin.storage.from("avatars").getPublicUrl(path).data.publicUrl);
    }
  }
  const galleryUrls = [...keptGallery, ...newGalleryUrls].slice(0, 8);

  // Validação para envio à verificação.
  if (intent === "submit") {
    if (!displayName || !crpNumber || !crpUf) {
      return { error: "Preencha nome de exibição, número e UF do CRP." };
    }
    if (!/^\d{2}\/\d{4,6}$/.test(crpNumber)) {
      return { error: "CRP inválido. Use o formato região/número, ex.: 06/153352." };
    }
    if (!phone || phone.length < 10) {
      return { error: "Informe um número de WhatsApp válido, com DDI e DDD." };
    }
    if (!crpDocumentPath) {
      return { error: "Envie o documento do CRP para solicitar a verificação." };
    }
    if (!headline || bioEmpty) {
      return { error: "Preencha o título e a apresentação do perfil." };
    }
  }

  const profileCompleted =
    !!displayName && !!crpNumber && !!crpUf && !!headline && !bioEmpty && !!crpDocumentPath;

  const slug = displayName
    ? `${slugify(displayName)}-${psyId.slice(0, 6)}`
    : null;

  const update: Record<string, unknown> = {
    display_name: displayName || null,
    slug,
    headline: headline || null,
    bio: bioEmpty ? null : sanitizeHtml(bio),
    gender,
    crp_number: crpNumber || null,
    crp_uf: crpUf,
    crp_document_path: crpDocumentPath,
    city,
    state,
    phone_whatsapp: phone,
    instagram,
    timezone,
    schedule,
    style,
    accepting_patients: acceptingPatients,
    formation,
    services,
    session_price_cents: sessionPrice,
    session_price_in_person_cents: sessionPriceInPerson,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    gallery_urls: galleryUrls,
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

  // Consulta o CFP assim que a pessoa envia para verificação, para o admin já
  // abrir a fila com a resposta oficial na tela. Falha aqui não trava o envio.
  if (intent === "submit") {
    try {
      await verificarCrpNoCfp(psyId, { timeoutMs: 12_000 });
    } catch {
      // segue para a conferência manual
    }
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

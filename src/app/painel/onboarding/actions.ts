"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";
import { verificarCrpNoCfp } from "@/lib/crp/verify";
import { grantCampaignVoz } from "@/lib/campaign-voz";
import { syncKommo } from "@/lib/kommo/sync";
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
    .select("id, crp_document_path, crp_number, crp_uf, verification_status, display_name, headline, bio, gender, city, state, phone_whatsapp, instagram, session_price_cents, session_price_in_person_cents, accepting_patients, formation")
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
    // Carimbo de atividade: quando a pessoa mexeu no próprio perfil. O admin
    // usa isso em Assinaturas para ver quem está ativo na base.
    profile_updated_at: new Date().toISOString(),
  };

  // Diff: exatamente quais campos mudaram neste salvamento, para o admin ver
  // o que cada pessoa mexeu (não só quando). Foto e galeria contam quando há
  // upload novo; os demais comparam valor antigo x novo.
  const campoMudou = (a: unknown, b: unknown) => (a ?? null) !== (b ?? null);
  const mudancas: string[] = [];
  if (campoMudou(existing?.display_name, displayName || null)) mudancas.push("nome");
  if (campoMudou(existing?.headline, headline || null)) mudancas.push("título");
  if (campoMudou(existing?.bio, bioEmpty ? null : sanitizeHtml(bio))) mudancas.push("apresentação");
  if (campoMudou(existing?.crp_number, crpNumber || null) || campoMudou(existing?.crp_uf, crpUf)) mudancas.push("CRP");
  if (campoMudou(existing?.crp_document_path, crpDocumentPath)) mudancas.push("documento do CRP");
  if (campoMudou(existing?.city, city) || campoMudou(existing?.state, state)) mudancas.push("localização");
  if (campoMudou(existing?.phone_whatsapp, phone)) mudancas.push("WhatsApp");
  if (campoMudou(existing?.instagram, instagram)) mudancas.push("Instagram");
  if (campoMudou(existing?.gender, gender)) mudancas.push("gênero");
  if (campoMudou(existing?.session_price_cents, sessionPrice) || campoMudou(existing?.session_price_in_person_cents, sessionPriceInPerson)) mudancas.push("valores");
  if (campoMudou(existing?.accepting_patients, acceptingPatients)) mudancas.push("disponibilidade");
  if (campoMudou(existing?.formation, formation)) mudancas.push("formação");
  if (avatarUrl) mudancas.push("foto");
  if (newGalleryUrls.length) mudancas.push("galeria");
  update.last_changed_fields = mudancas;

  // Reverificação só quando faz sentido. Um psicólogo já aprovado que edita a
  // foto, a bio ou o valor NÃO deve voltar para a fila nem sair do ar. Só volta
  // a "pendente" se ainda não foi aprovado, ou se mudou o CRP (número, UF ou
  // documento), que é o que a equipe realmente confere.
  // Marca se esta gravação gera uma verificação nova. Só nesse caso vale a
  // pena consultar o CFP; um aprovado que só edita a bio não reconsulta.
  let precisaVerificar = false;
  if (intent === "submit") {
    const jaAprovado = existing?.verification_status === "aprovado";
    const tinhaDocumento = !!existing?.crp_document_path;
    const numeroOuUfMudou =
      (existing?.crp_number ?? null) !== (crpNumber || null) ||
      (existing?.crp_uf ?? null) !== crpUf;
    // Anexar o documento pela PRIMEIRA vez não é reverificação. As verificadas
    // herdadas da plataforma anterior vieram sem documento; ao completar o
    // perfil elas precisam anexar um, e isso não pode derrubar o selo delas.
    // Só conta como mudança trocar um documento que já existia.
    const documentoTrocado =
      tinhaDocumento && (existing?.crp_document_path ?? null) !== crpDocumentPath;
    const crpMudou = numeroOuUfMudou || documentoTrocado;

    if (!jaAprovado || crpMudou) {
      update.verification_status = "pendente";
      precisaVerificar = true;
    }
    // Já aprovada e sem mudar número/UF (nem trocar doc existente): mantém
    // aprovada e publicada, e ainda ganha o Voz ao completar.
  }

  const { error: updErr } = await supabase
    .from("psychologists")
    .update(update)
    .eq("id", psyId);
  if (updErr) {
    return { error: `Não foi possível salvar: ${updErr.message}` };
  }

  // Consulta o CFP só quando há verificação nova, para o admin já abrir a fila
  // com a resposta oficial. Timeout curto (6s) para NUNCA estourar o limite da
  // função na Vercel: um aprovado editando o perfil não pode tomar erro 500 por
  // causa de uma consulta externa lenta. Falha aqui só cai para conferência
  // manual, nunca trava o salvamento.
  if (precisaVerificar) {
    try {
      await verificarCrpNoCfp(psyId, { timeoutMs: 6_000 });
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

  // Campanha de reativação: quem já está aprovado e completa o perfil dentro
  // da janela ganha 90 dias de Voz na hora. Para quem ainda está pendente, a
  // concessão acontece no momento da aprovação (ver ações do admin). É
  // idempotente, então chamar aqui e lá não concede duas vezes.
  await grantCampaignVoz(psyId);

  // Espelha o novo cadastro no Kommo (só cria o lead na primeira vez).
  await syncKommo(psyId, "cadastro", { onlyIfNew: true });

  revalidatePath("/painel");
  if (intent === "submit") {
    redirect("/painel?enviado=1");
  }
  return { error: null, ok: true };
}

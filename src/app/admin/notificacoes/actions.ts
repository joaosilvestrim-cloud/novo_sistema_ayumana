"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell, type EmailBlock } from "@/lib/email";
import type { PlanTier } from "@/lib/types";

/** Endereço que aparece no "para" dos comunicados; a base vai em cópia oculta. */
const REMETENTE_INTERNO =
  (process.env.EMAIL_FROM || "contato@ayumana.com.br").match(/<([^>]+)>/)?.[1] ||
  process.env.EMAIL_FROM ||
  "contato@ayumana.com.br";

export type Audience =
  | "todos"
  | "publicados"
  | "em_teste"
  | "pagantes"
  | "incompletos"
  | "plano"
  | "avulso";

function volta(msg: string, tipo: "ok" | "erro" = "erro"): never {
  redirect(`/admin/notificacoes?${tipo}=${encodeURIComponent(msg)}`);
}

/** Converte o público escolhido na lista de e-mails de destino. */
async function destinatarios(
  admin: ReturnType<typeof createAdminClient>,
  publico: Audience,
  plano: string,
  emailAvulso: string
): Promise<string[]> {
  if (publico === "avulso") {
    return emailAvulso
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));
  }

  let q = admin.from("psychologists").select("profile_id, plan_tier, is_published, profile_completed, trial_ends_at");

  if (publico === "publicados") q = q.eq("is_published", true);
  if (publico === "incompletos") q = q.eq("profile_completed", false);
  if (publico === "plano") q = q.eq("plan_tier", plano);
  if (publico === "pagantes") q = q.neq("plan_tier", "essencial");
  if (publico === "em_teste") q = q.gt("trial_ends_at", new Date().toISOString());

  const { data } = await q;
  const ids = (data ?? []).map((r) => r.profile_id as string).filter(Boolean);
  if (!ids.length) return [];

  const emails: string[] = [];
  // Em blocos, porque o .in() tem limite prático de tamanho de URL.
  for (let i = 0; i < ids.length; i += 200) {
    const { data: perfis } = await admin
      .from("profiles")
      .select("email")
      .in("id", ids.slice(i, i + 200));
    for (const p of perfis ?? []) {
      const e = (p.email as string)?.trim().toLowerCase();
      if (e?.includes("@")) emails.push(e);
    }
  }
  return Array.from(new Set(emails));
}

export async function sendBroadcastAction(formData: FormData) {
  const me = await requireAdmin();
  const publico = String(formData.get("publico") ?? "avulso") as Audience;
  const plano = String(formData.get("plano") ?? "essencial") as PlanTier;
  const emailAvulso = String(formData.get("email_avulso") ?? "");
  const assunto = String(formData.get("assunto") ?? "").trim();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const corpo = String(formData.get("corpo") ?? "").trim();
  const ctaLabel = String(formData.get("cta_label") ?? "").trim();
  const ctaUrl = String(formData.get("cta_url") ?? "").trim();
  const teste = formData.get("teste") === "1";

  if (!assunto) volta("Escreva o assunto do e-mail.");
  if (!corpo) volta("Escreva a mensagem.");

  const admin = createAdminClient();

  // Envio de teste vai só para o próprio admin.
  let lista: string[];
  if (teste) {
    const { data: eu } = await admin.from("profiles").select("email").eq("id", me.id).maybeSingle();
    const meuEmail = (eu?.email as string) ?? "";
    if (!meuEmail) volta("Sua conta não tem e-mail cadastrado.");
    lista = [meuEmail];
  } else {
    lista = await destinatarios(admin, publico, plano, emailAvulso);
    if (!lista.length) volta("Nenhum destinatário encontrado para esse público.");
  }

  // Cada linha em branco vira um parágrafo; linhas que começam com "- " viram lista.
  const paragrafos = corpo.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const blocks: EmailBlock[] = [];
  for (const p of paragrafos) {
    const linhas = p.split("\n").map((l) => l.trim()).filter(Boolean);
    const soBullets = linhas.length > 1 && linhas.every((l) => /^[-•*]\s+/.test(l));
    if (soBullets) {
      blocks.push({ type: "list", items: linhas.map((l) => l.replace(/^[-•*]\s+/, "")) });
    } else {
      blocks.push({ type: "paragraph", text: linhas.join("<br/>") });
    }
  }

  const html = emailShell({
    preheader: paragrafos[0]?.slice(0, 120),
    heading: titulo || assunto,
    blocks,
    cta: ctaLabel && ctaUrl ? { label: ctaLabel, url: ctaUrl } : undefined,
    footerNote: "Você recebeu este e-mail porque tem cadastro na Ayumana.",
  });

  // Envio em blocos com cópia oculta: ninguém vê o e-mail de ninguém, e a base
  // inteira cabe em poucas chamadas (uma por pessoa estouraria o tempo limite).
  const BLOCO = 50;
  let enviados = 0;
  for (let i = 0; i < lista.length; i += BLOCO) {
    const bloco = lista.slice(i, i + BLOCO);
    const ok = await sendEmail({
      to: bloco.length === 1 ? bloco[0] : REMETENTE_INTERNO,
      bcc: bloco.length === 1 ? undefined : bloco,
      subject: assunto,
      html,
      kind: "broadcast",
      createdBy: me.id,
    });
    if (ok) enviados += bloco.length;
  }

  revalidatePath("/admin/notificacoes");
  volta(
    teste
      ? `E-mail de teste enviado para ${lista[0]}.`
      : `Enviado para ${enviados} de ${lista.length} destinatário(s).`,
    "ok"
  );
}

/** Quantas pessoas o público selecionado atinge, sem enviar nada. */
export async function countAudienceAction(publico: Audience, plano: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const lista = await destinatarios(admin, publico, plano, "");
  return lista.length;
}

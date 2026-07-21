"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCrpApproved, sendCrpRejected } from "@/lib/email";
import { verificarCrpNoCfp } from "@/lib/crp/verify";

/** Reconsulta o Cadastro Nacional do CFP para um psicólogo. */
export async function checkCfpAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await verificarCrpNoCfp(id);
  revalidatePath("/admin/verificacao");
  revalidatePath(`/admin/usuarios/${id}`);
}

/**
 * Registra a conferência feita à mão no site do CFP. É o caminho gratuito:
 * o admin abre o Cadastro Nacional, resolve o captcha, olha a situação e
 * marca aqui. Grava nas mesmas colunas da consulta automática.
 */
export async function markCfpManualAction(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const resultado = String(formData.get("resultado") ?? "");
  const nomeCfp = String(formData.get("nome_cfp") ?? "").trim();
  if (!id || !["ativo", "irregular", "nao_encontrado"].includes(resultado)) return;

  const supabase = createAdminClient();
  const { data: quem } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", me.id)
    .maybeSingle();
  const autor = (quem?.full_name as string) || (quem?.email as string) || "admin";

  await supabase
    .from("psychologists")
    .update({
      crp_auto_status: resultado,
      crp_auto_nome: nomeCfp || null,
      crp_auto_situacao: `Conferido à mão no site do CFP por ${autor}`,
      crp_auto_checked_at: new Date().toISOString(),
      crp_auto_payload: null,
    })
    .eq("id", id);

  revalidatePath("/admin/verificacao");
}

/**
 * Consulta em lote quem ainda não foi checado. Limitado por clique porque cada
 * consulta é cobrada pelo provedor.
 */
export async function checkCfpBatchAction(formData: FormData) {
  await requireAdmin();
  const limite = Math.min(Number(formData.get("limite") ?? 25) || 25, 50);
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("psychologists")
    .select("id")
    .is("crp_auto_checked_at", null)
    .not("crp_number", "is", null)
    .not("crp_uf", "is", null)
    .limit(limite);

  for (const row of data ?? []) {
    await verificarCrpNoCfp(row.id as string);
  }
  revalidatePath("/admin/verificacao");
}

/** Busca e-mail e nome do psicólogo para notificação. */
async function contact(supabase: ReturnType<typeof createAdminClient>, id: string) {
  const { data: psy } = await supabase
    .from("psychologists")
    .select("display_name, slug, profile_id")
    .eq("id", id)
    .single();
  if (!psy) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", psy.profile_id)
    .single();
  return { email: prof?.email as string | undefined, name: psy.display_name as string | null, slug: psy.slug as string | null };
}

export async function approveAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createAdminClient();
  await supabase
    .from("psychologists")
    .update({
      verification_status: "aprovado",
      verification_notes: null,
      verified_at: new Date().toISOString(),
      verified_by: admin.id,
      is_published: true,
    })
    .eq("id", id);

  const c = await contact(supabase, id);
  if (c?.email) await sendCrpApproved(c.email, c.name, c.slug);

  revalidatePath("/admin/verificacao");
}

export async function rejectAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;
  const reason = notes || "Documento ou dados de CRP não conferem.";

  const supabase = createAdminClient();
  await supabase
    .from("psychologists")
    .update({
      verification_status: "reprovado",
      verification_notes: reason,
      verified_at: new Date().toISOString(),
      verified_by: admin.id,
      is_published: false,
    })
    .eq("id", id);

  const c = await contact(supabase, id);
  if (c?.email) await sendCrpRejected(c.email, c.name, reason);

  revalidatePath("/admin/verificacao");
}

"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { itemPertenceAoPerfil, psyIdFromProfile, currentCycle } from "@/lib/studio";
import type { ContentFormat } from "@/lib/types";

const FORMATS: ContentFormat[] = ["post", "story", "reel", "carrossel", "outro"];

function rev(psyId?: string | null) {
  revalidatePath("/painel/conteudo");
  if (psyId) revalidatePath(`/estudio/psicologo/${psyId}`);
  revalidatePath("/estudio");
}

/** Nome que aparece na conversa. */
async function meuNome(profileId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", profileId)
    .maybeSingle();
  return ((data?.full_name as string) || (data?.email as string) || "Psicólogo") as string;
}

/**
 * Toda ação confere se a peça é mesmo do psicólogo logado antes de escrever.
 * Sem isso, saber o id de uma peça bastaria para mexer no conteúdo de outro.
 */
async function autoriza(itemId: string) {
  const perfil = await getProfile();
  if (!perfil || perfil.role !== "psicologo") return null;
  const item = await itemPertenceAoPerfil(itemId, perfil.id);
  if (!item) return null;
  return { perfil, item, admin: createAdminClient() };
}

/** O psicólogo aprova a peça. Vai direto para os arquivos finais. */
export async function approveItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ctx = await autoriza(id);
  if (!ctx) return;
  const { perfil, item, admin } = ctx;

  const agora = new Date().toISOString();
  await admin
    .from("content_items")
    .update({
      status: "aprovado",
      approved_at: agora,
      updated_at: agora,
      last_touch_by: "psicologo",
      psy_seen_at: agora,
    })
    .eq("id", id);

  await admin.from("content_comments").insert({
    item_id: id,
    author_id: perfil.id,
    author_name: await meuNome(perfil.id),
    author_side: "psicologo",
    body: "Aprovei esta peça. Pode finalizar.",
    kind: "aprovacao",
  });

  rev(item.psychologist_id);
}

/** O psicólogo pede ajuste. O texto do pedido é obrigatório. */
export async function requestChangesAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const texto = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const ctx = await autoriza(id);
  if (!ctx || !texto) return;
  const { perfil, item, admin } = ctx;

  const agora = new Date().toISOString();
  await admin
    .from("content_items")
    .update({
      status: "ajustes",
      updated_at: agora,
      last_touch_by: "psicologo",
      psy_seen_at: agora,
      feedback: texto,
    })
    .eq("id", id);

  await admin.from("content_comments").insert({
    item_id: id,
    author_id: perfil.id,
    author_name: await meuNome(perfil.id),
    author_side: "psicologo",
    body: texto,
    kind: "ajuste",
  });

  rev(item.psychologist_id);
}

/** Mensagem solta na conversa da peça. */
export async function psyCommentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const texto = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const ctx = await autoriza(id);
  if (!ctx || !texto) return;
  const { perfil, item, admin } = ctx;

  await admin.from("content_comments").insert({
    item_id: id,
    author_id: perfil.id,
    author_name: await meuNome(perfil.id),
    author_side: "psicologo",
    body: texto,
    kind: "mensagem",
  });
  await admin
    .from("content_items")
    .update({ last_touch_by: "psicologo", psy_seen_at: new Date().toISOString() })
    .eq("id", id);

  rev(item.psychologist_id);
}

/** Marca as mensagens do estúdio como lidas. */
export async function markPsySeenAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ctx = await autoriza(id);
  if (!ctx) return;
  await ctx.admin
    .from("content_items")
    .update({ psy_seen_at: new Date().toISOString() })
    .eq("id", id);
  rev(ctx.item.psychologist_id);
}

/** O psicólogo pede uma peça nova, já com o tema que ele quer. */
export async function requestPieceAction(formData: FormData) {
  const perfil = await getProfile();
  if (!perfil || perfil.role !== "psicologo") return;

  const titulo = String(formData.get("title") ?? "").trim().slice(0, 140);
  const brief = String(formData.get("brief") ?? "").trim().slice(0, 2000);
  const formato = String(formData.get("format") ?? "post") as ContentFormat;
  if (!titulo) return;

  const psyId = await psyIdFromProfile(perfil.id);
  if (!psyId) return;

  const admin = createAdminClient();
  const cycle = currentCycle();

  // Entra no fim da fila do ciclo.
  const { data: ultima } = await admin
    .from("content_items")
    .select("position")
    .eq("psychologist_id", psyId)
    .eq("cycle", cycle)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: novo } = await admin
    .from("content_items")
    .insert({
      psychologist_id: psyId,
      cycle,
      title: titulo,
      format: FORMATS.includes(formato) ? formato : "post",
      status: "briefing",
      brief: brief || null,
      requested_by: perfil.id,
      last_touch_by: "psicologo",
      position: ((ultima?.position as number) ?? 0) + 1,
    })
    .select("id")
    .maybeSingle();

  if (novo?.id) {
    await admin.from("content_comments").insert({
      item_id: novo.id as string,
      author_id: perfil.id,
      author_name: await meuNome(perfil.id),
      author_side: "psicologo",
      body: brief ? `Pedi esta peça. ${brief}` : "Pedi esta peça.",
      kind: "sistema",
    });
  }

  rev(psyId);
}

"use server";

import { revalidatePath } from "next/cache";
import { requireContentStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PECAS_POR_CICLO } from "@/lib/studio";
import type { ContentFormat, ContentStatusKey } from "@/lib/types";

const STATUSES: ContentStatusKey[] = ["briefing", "producao", "revisao", "ajustes", "aprovado", "entregue"];
const FORMATS: ContentFormat[] = ["post", "story", "reel", "carrossel", "outro"];

function rev(psyId: string) {
  revalidatePath(`/estudio/psicologo/${psyId}`);
  revalidatePath("/estudio");
  revalidatePath("/painel/conteudo");
}

/** Registra uma linha na conversa da peça. */
async function comentar(
  admin: ReturnType<typeof createAdminClient>,
  itemId: string,
  autor: { id: string; nome: string | null },
  body: string,
  kind: "mensagem" | "aprovacao" | "ajuste" | "sistema" = "mensagem"
) {
  await admin.from("content_comments").insert({
    item_id: itemId,
    author_id: autor.id,
    author_name: autor.nome,
    author_side: "estudio",
    body,
    kind,
  });
}

async function nomeDe(admin: ReturnType<typeof createAdminClient>, profileId: string) {
  const { data } = await admin.from("profiles").select("full_name, email").eq("id", profileId).maybeSingle();
  return ((data?.full_name as string) || (data?.email as string) || "Estúdio") as string;
}

/** Cria as 8 peças do ciclo (competência) para um cliente. */
export async function generateCycleAction(formData: FormData) {
  const me = await requireContentStaff();
  const psyId = String(formData.get("psy_id") ?? "");
  const cycle = String(formData.get("cycle") ?? "");
  if (!psyId || !cycle) return;

  const admin = createAdminClient();
  const { count } = await admin
    .from("content_items")
    .select("id", { count: "exact", head: true })
    .eq("psychologist_id", psyId)
    .eq("cycle", cycle);
  if ((count ?? 0) > 0) return; // já existe ciclo

  const rows = Array.from({ length: PECAS_POR_CICLO }, (_, i) => ({
    psychologist_id: psyId,
    cycle,
    title: `Peça ${i + 1}`,
    format: "post" as ContentFormat,
    status: "briefing" as ContentStatusKey,
    assigned_to: me.id,
    position: i,
  }));
  await admin.from("content_items").insert(rows);
  rev(psyId);
}

export async function createItemAction(formData: FormData) {
  const me = await requireContentStaff();
  const psyId = String(formData.get("psy_id") ?? "");
  const cycle = String(formData.get("cycle") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Nova peça";
  const format = String(formData.get("format") ?? "post") as ContentFormat;
  if (!psyId || !cycle) return;

  const admin = createAdminClient();
  await admin.from("content_items").insert({
    psychologist_id: psyId,
    cycle,
    title,
    format: FORMATS.includes(format) ? format : "post",
    status: "briefing",
    assigned_to: me.id,
    position: 99,
  });
  rev(psyId);
}

export async function updateItemAction(formData: FormData) {
  await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  if (!id) return;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const title = formData.get("title");
  const format = formData.get("format");
  const brief = formData.get("brief");
  const feedback = formData.get("feedback");
  if (title !== null) patch.title = String(title).trim() || "Peça";
  if (format !== null && FORMATS.includes(String(format) as ContentFormat)) patch.format = String(format);
  if (brief !== null) patch.brief = String(brief).trim() || null;
  if (feedback !== null) patch.feedback = String(feedback).trim() || null;

  const admin = createAdminClient();
  await admin.from("content_items").update(patch).eq("id", id);
  rev(psyId);
}

export async function moveStatusAction(formData: FormData) {
  const me = await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  const status = String(formData.get("status") ?? "") as ContentStatusKey;
  if (!id || !STATUSES.includes(status)) return;

  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    last_touch_by: "estudio",
  };
  if (status === "entregue") patch.delivered_at = new Date().toISOString();

  await admin.from("content_items").update(patch).eq("id", id);

  // Quando a peça vai para revisão ou entrega, a conversa registra o marco.
  if (status === "revisao" || status === "entregue") {
    const nome = await nomeDe(admin, me.id);
    await comentar(
      admin,
      id,
      { id: me.id, nome },
      status === "revisao"
        ? "Enviei a arte para você conferir. Pode aprovar ou pedir ajuste."
        : "Peça finalizada e liberada para download.",
      "sistema"
    );
  }
  rev(psyId);
}

/** Move e reordena numa tacada só, usado pelo arrastar e soltar. */
export async function reorderAction(formData: FormData) {
  const me = await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  const status = String(formData.get("status") ?? "") as ContentStatusKey;
  const position = Number(formData.get("position") ?? 0) || 0;
  if (!id || !STATUSES.includes(status)) return;

  const admin = createAdminClient();
  const { data: antes } = await admin.from("content_items").select("status").eq("id", id).maybeSingle();
  const mudouEtapa = antes?.status !== status;

  const patch: Record<string, unknown> = { status, position, last_touch_by: "estudio" };
  if (mudouEtapa) patch.updated_at = new Date().toISOString();
  if (status === "entregue") patch.delivered_at = new Date().toISOString();
  await admin.from("content_items").update(patch).eq("id", id);

  if (mudouEtapa && (status === "revisao" || status === "entregue")) {
    const nome = await nomeDe(admin, me.id);
    await comentar(
      admin,
      id,
      { id: me.id, nome },
      status === "revisao"
        ? "Enviei a arte para você conferir. Pode aprovar ou pedir ajuste."
        : "Peça finalizada e liberada para download.",
      "sistema"
    );
  }
  rev(psyId);
}

/** Prazo, legenda e hashtags. */
export async function setDetailsAction(formData: FormData) {
  await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  if (!id) return;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const due = String(formData.get("due_date") ?? "").trim();
  if (formData.has("due_date")) patch.due_date = due || null;
  if (formData.has("caption")) patch.caption = String(formData.get("caption") ?? "").trim() || null;
  if (formData.has("hashtags")) patch.hashtags = String(formData.get("hashtags") ?? "").trim() || null;

  const admin = createAdminClient();
  await admin.from("content_items").update(patch).eq("id", id);
  rev(psyId);
}

/** Mensagem do estúdio dentro da peça. */
export async function studioCommentAction(formData: FormData) {
  const me = await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!id || !body) return;

  const admin = createAdminClient();
  const nome = await nomeDe(admin, me.id);
  await comentar(admin, id, { id: me.id, nome }, body);
  await admin
    .from("content_items")
    .update({ last_touch_by: "estudio", studio_seen_at: new Date().toISOString() })
    .eq("id", id);
  rev(psyId);
}

/** Marca as mensagens do psicólogo como lidas. */
export async function markStudioSeenAction(formData: FormData) {
  await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("content_items").update({ studio_seen_at: new Date().toISOString() }).eq("id", id);
  rev(psyId);
}

export async function uploadAssetAction(formData: FormData) {
  const me = await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  const nota = String(formData.get("note") ?? "").trim() || null;
  const file = formData.get("asset") as File | null;
  if (!id || !file || file.size === 0) return;
  if (file.size > 25 * 1024 * 1024) return;

  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${psyId}/${id}-${Date.now()}.${ext}`;
  const { error } = await admin.storage
    .from("estudio")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) return;
  const url = admin.storage.from("estudio").getPublicUrl(path).data.publicUrl;

  // Cada envio vira uma versão nova; a anterior continua acessível.
  const { data: ultima } = await admin
    .from("content_versions")
    .select("version")
    .eq("item_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const versao = ((ultima?.version as number) ?? 0) + 1;

  await admin.from("content_versions").insert({
    item_id: id,
    version: versao,
    url,
    mime: file.type || null,
    uploaded_by: me.id,
    note: nota,
  });
  await admin
    .from("content_items")
    .update({ asset_url: url, updated_at: new Date().toISOString(), last_touch_by: "estudio" })
    .eq("id", id);

  const nome = await nomeDe(admin, me.id);
  await comentar(
    admin,
    id,
    { id: me.id, nome },
    versao === 1 ? "Subi a primeira versão da arte." : `Subi a versão ${versao} da arte.${nota ? ` ${nota}` : ""}`,
    "sistema"
  );
  rev(psyId);
}

export async function deleteItemAction(formData: FormData) {
  await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("content_items").delete().eq("id", id);
  rev(psyId);
}

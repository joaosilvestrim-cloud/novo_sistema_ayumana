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
  await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  const status = String(formData.get("status") ?? "") as ContentStatusKey;
  if (!id || !STATUSES.includes(status)) return;
  const admin = createAdminClient();
  await admin.from("content_items").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  rev(psyId);
}

export async function uploadAssetAction(formData: FormData) {
  await requireContentStaff();
  const id = String(formData.get("id") ?? "");
  const psyId = String(formData.get("psy_id") ?? "");
  const file = formData.get("asset") as File | null;
  if (!id || !file || file.size === 0) return;
  if (file.size > 25 * 1024 * 1024) return;

  const admin = createAdminClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${psyId}/${id}-${Date.now()}.${ext}`;
  const { error } = await admin.storage.from("estudio").upload(path, file, { upsert: true, contentType: file.type });
  if (error) return;
  const url = admin.storage.from("estudio").getPublicUrl(path).data.publicUrl;
  await admin.from("content_items").update({ asset_url: url, updated_at: new Date().toISOString() }).eq("id", id);
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

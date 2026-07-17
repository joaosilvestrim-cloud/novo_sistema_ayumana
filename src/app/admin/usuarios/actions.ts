"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleAdminAction(formData: FormData) {
  const me = await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  const makeAdmin = String(formData.get("make_admin") ?? "") === "1";
  if (!profileId) return;
  // Evita o admin rebaixar a si mesmo por acidente.
  if (profileId === me.id && !makeAdmin) return;

  const admin = createAdminClient();
  await admin.from("profiles").update({ role: makeAdmin ? "admin" : "psicologo" }).eq("id", profileId);
  revalidatePath("/admin/usuarios");
}

export async function togglePublishAction(formData: FormData) {
  await requireAdmin();
  const psyId = String(formData.get("psy_id") ?? "");
  const publish = String(formData.get("publish") ?? "") === "1";
  if (!psyId) return;

  const admin = createAdminClient();
  await admin.from("psychologists").update({ is_published: publish }).eq("id", psyId);
  revalidatePath("/admin/usuarios");
  revalidatePath("/psicologos");
}

export async function quickApproveAction(formData: FormData) {
  const me = await requireAdmin();
  const psyId = String(formData.get("psy_id") ?? "");
  if (!psyId) return;

  const admin = createAdminClient();
  await admin
    .from("psychologists")
    .update({
      verification_status: "aprovado",
      verified_at: new Date().toISOString(),
      verified_by: me.id,
      is_published: true,
    })
    .eq("id", psyId);
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/verificacao");
  revalidatePath("/psicologos");
}

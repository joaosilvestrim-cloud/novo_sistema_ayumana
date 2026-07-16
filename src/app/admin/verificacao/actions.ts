"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
      is_published: true, // o trigger mantém true só se profile_completed
    })
    .eq("id", id);

  revalidatePath("/admin/verificacao");
}

export async function rejectAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;

  const supabase = createAdminClient();
  await supabase
    .from("psychologists")
    .update({
      verification_status: "reprovado",
      verification_notes: notes || "Documento ou dados de CRP não conferem.",
      verified_at: new Date().toISOString(),
      verified_by: admin.id,
      is_published: false,
    })
    .eq("id", id);

  revalidatePath("/admin/verificacao");
}

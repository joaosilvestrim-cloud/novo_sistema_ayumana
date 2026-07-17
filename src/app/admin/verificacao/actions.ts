"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCrpApproved, sendCrpRejected } from "@/lib/email";

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

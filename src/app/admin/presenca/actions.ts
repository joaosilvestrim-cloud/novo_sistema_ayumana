"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUSES = ["pendente", "contatado", "aprovado", "recusado"];

export async function setWaitlistStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status)) return;
  const admin = createAdminClient();
  await admin.from("presenca_waitlist").update({ status }).eq("id", id);
  revalidatePath("/admin/presenca");
}

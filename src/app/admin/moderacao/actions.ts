"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function moderate(
  table: "forum_questions" | "forum_answers",
  formData: FormData
) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["aprovar", "reprovar"].includes(decision)) return;

  const admin = createAdminClient();
  const update: Record<string, unknown> =
    decision === "aprovar"
      ? { status: "publicada", published_at: new Date().toISOString() }
      : { status: "reprovada" };

  await admin.from(table).update(update).eq("id", id);
  revalidatePath("/admin/moderacao");
  revalidatePath("/perguntas");
}

export async function moderateQuestionAction(formData: FormData) {
  await moderate("forum_questions", formData);
}

export async function moderateAnswerAction(formData: FormData) {
  await moderate("forum_answers", formData);
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateUserState = { error: string | null; ok?: boolean; email?: string };

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "admin") === "admin" ? "admin" : "psicologo";
  const mode = String(formData.get("mode") ?? "senha"); // "senha" | "convite"
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email.includes("@")) {
    return { error: "Informe nome e um e-mail válido." };
  }
  if (mode === "senha" && password.length < 8) {
    return { error: "A senha precisa ter ao menos 8 caracteres." };
  }

  const admin = createAdminClient();
  let userId: string | undefined;

  if (mode === "convite") {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || undefined;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      ...(siteUrl ? { redirectTo: `${siteUrl}/login` } : {}),
    });
    if (error) {
      return { error: `Não foi possível convidar: ${error.message}` };
    }
    userId = data.user?.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) {
      if (error.message.toLowerCase().includes("registered") || error.message.toLowerCase().includes("exist")) {
        return { error: "Já existe uma conta com este e-mail." };
      }
      return { error: `Não foi possível criar: ${error.message}` };
    }
    userId = data.user?.id;
  }

  if (!userId) return { error: "Falha ao obter o usuário criado." };

  // Garante o profile com o papel escolhido (o trigger cria o profile no signup).
  await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    email,
    role,
  });

  revalidatePath("/admin/usuarios");
  return { error: null, ok: true, email };
}

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

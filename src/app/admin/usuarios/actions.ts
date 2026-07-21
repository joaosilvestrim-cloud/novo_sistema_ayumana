"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell } from "@/lib/email";

export type CreateUserState = { error: string | null; ok?: boolean; email?: string };

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireAdmin();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const roleRaw = String(formData.get("role") ?? "admin");
  const role = (["admin", "psicologo", "conteudo"] as const).includes(roleRaw as never) ? roleRaw : "psicologo";
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

export async function setRoleAction(formData: FormData) {
  const me = await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!profileId || !(["admin", "psicologo", "conteudo"] as const).includes(role as never)) return;
  if (profileId === me.id && role !== "admin") return; // não se auto-rebaixa
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", profileId);
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

const PLAN_TIERS = ["essencial", "destaque", "ideal", "presenca"] as const;

export async function changePlanAction(formData: FormData) {
  await requireAdmin();
  const psyId = String(formData.get("psy_id") ?? "");
  const plan = String(formData.get("plan") ?? "");
  if (!psyId || !PLAN_TIERS.includes(plan as (typeof PLAN_TIERS)[number])) return;

  const admin = createAdminClient();
  await admin.from("psychologists").update({ plan_tier: plan }).eq("id", psyId);
  revalidatePath("/admin/usuarios");
  revalidatePath("/psicologos");
}

export async function sendPasswordResetAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return;

  const admin = createAdminClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${site}/redefinir-senha` },
  });
  const link = data?.properties?.action_link;
  if (error || !link) return;

  await sendEmail({
    to: email,
    subject: "Redefinição de senha — Ayumana",
    kind: "senha",
    html: emailShell({
      heading: "Redefinir sua senha",
      bodyHtml:
        "Recebemos um pedido para redefinir a senha da sua conta na Ayumana. Clique no botão abaixo para escolher uma nova senha. Se não foi você, ignore este e-mail.",
      cta: { label: "Definir nova senha", url: link },
    }),
  });
  revalidatePath("/admin/usuarios");
}

const TRIAL_DIAS = 30;
const TRIAL_TIER = "ideal"; // plano "Voz"

/** Zera as marcas de aviso para o novo teste avisar de novo. */
const TRIAL_RESET = { trial_notified_7: false, trial_notified_1: false };

function trialFim(dias = TRIAL_DIAS): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString();
}

/** Concede o teste gratuito a UM psicólogo. */
export async function grantTrialAction(formData: FormData) {
  await requireAdmin();
  const psyId = String(formData.get("psy_id") ?? "");
  const dias = Number(formData.get("dias") ?? TRIAL_DIAS) || TRIAL_DIAS;
  if (!psyId) return;
  const admin = createAdminClient();
  await admin
    .from("psychologists")
    .update({ trial_tier: TRIAL_TIER, trial_ends_at: trialFim(dias), ...TRIAL_RESET })
    .eq("id", psyId);
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios`);
  revalidatePath("/psicologos");
}

/** Encerra o teste de UM psicólogo (volta ao plano contratado na hora). */
export async function revokeTrialAction(formData: FormData) {
  await requireAdmin();
  const psyId = String(formData.get("psy_id") ?? "");
  if (!psyId) return;
  const admin = createAdminClient();
  await admin
    .from("psychologists")
    .update({ trial_tier: null, trial_ends_at: null })
    .eq("id", psyId);
  revalidatePath("/admin/usuarios");
  revalidatePath("/psicologos");
}

export async function bulkUsersAction(formData: FormData) {
  const me = await requireAdmin();
  const op = String(formData.get("op") ?? "");
  const psyIds = String(formData.get("psy_ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const profileIds = String(formData.get("profile_ids") ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const plan = String(formData.get("plan") ?? "");
  const admin = createAdminClient();

  if ((op === "publish" || op === "unpublish") && psyIds.length) {
    await admin.from("psychologists").update({ is_published: op === "publish" }).in("id", psyIds);
  } else if (op === "approve" && psyIds.length) {
    await admin.from("psychologists").update({
      verification_status: "aprovado",
      verified_at: new Date().toISOString(),
      verified_by: me.id,
      is_published: true,
    }).in("id", psyIds);
  } else if (op === "plan" && PLAN_TIERS.includes(plan as (typeof PLAN_TIERS)[number]) && psyIds.length) {
    await admin.from("psychologists").update({ plan_tier: plan }).in("id", psyIds);
  } else if (op === "trial" && psyIds.length) {
    await admin
      .from("psychologists")
      .update({ trial_tier: TRIAL_TIER, trial_ends_at: trialFim(), ...TRIAL_RESET })
      .in("id", psyIds);
  } else if (op === "trial_end" && psyIds.length) {
    await admin
      .from("psychologists")
      .update({ trial_tier: null, trial_ends_at: null })
      .in("id", psyIds);
  } else if (op === "delete") {
    for (const pid of profileIds) {
      if (pid === me.id) continue; // nunca a própria conta
      await admin.auth.admin.deleteUser(pid);
      await admin.from("psychologists").delete().eq("profile_id", pid);
      await admin.from("profiles").delete().eq("id", pid);
    }
  }
  revalidatePath("/admin/usuarios");
  revalidatePath("/psicologos");
}

export async function deleteUserAction(formData: FormData) {
  const me = await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  if (!profileId) return;
  // Nunca deixa o admin excluir a própria conta.
  if (profileId === me.id) return;

  const admin = createAdminClient();
  // Apaga o usuário do Auth (o profile costuma cair por cascata)...
  await admin.auth.admin.deleteUser(profileId);
  // ...e garante a limpeza das tabelas mesmo se o cascade não propagar.
  await admin.from("psychologists").delete().eq("profile_id", profileId);
  await admin.from("profiles").delete().eq("id", profileId);
  revalidatePath("/admin/usuarios");
  revalidatePath("/psicologos");
  redirect("/admin/usuarios");
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

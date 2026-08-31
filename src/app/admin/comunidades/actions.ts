"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

const s = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};

export async function saveCommunityAction(formData: FormData): Promise<{ ok: boolean; error?: string; slug?: string; id?: string }> {
  await requireAdmin();
  const admin = createAdminClient();

  const id = s(formData, "id");
  const name = s(formData, "name");
  if (!name) return { ok: false, error: "Informe o nome da comunidade." };
  const country = s(formData, "country_code");
  if (!country) return { ok: false, error: "Selecione o país." };

  let slug = s(formData, "slug");
  if (!slug) slug = slugify(name);
  slug = slugify(slug);

  // Upload de logo/capa (opcional). Sobe para o bucket público e usa a URL; se
  // não subir arquivo novo, mantém a URL do campo (que vem preenchida na edição).
  const subir = async (key: string, kind: string): Promise<string | null> => {
    const file = formData.get(key);
    if (!(file instanceof File) || file.size === 0) return null;
    if (file.size > 5 * 1024 * 1024) throw new Error("A imagem excede 5 MB.");
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `communities/${slug}-${kind}-${Date.now()}.${ext}`;
    const { error } = await admin.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(`Falha no upload: ${error.message}`);
    return admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };
  let logoUp: string | null = null, coverUp: string | null = null;
  try {
    logoUp = await subir("logo_file", "logo");
    coverUp = await subir("cover_file", "capa");
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const themes = (formData.getAll("themes") as string[]).filter(Boolean);

  const record: Record<string, unknown> = {
    name,
    slug,
    country_code: country,
    city_region: s(formData, "city_region"),
    type: s(formData, "type") ?? "associacao",
    status: s(formData, "status") ?? "prospect",
    logo_url: logoUp ?? s(formData, "logo_url"),
    cover_image_url: coverUp ?? s(formData, "cover_image_url"),
    themes,
    website_url: s(formData, "website_url"),
    instagram_url: s(formData, "instagram_url"),
    contact_email: s(formData, "contact_email"),
    contact_name: s(formData, "contact_name"),
    headline: s(formData, "headline"),
    intro_text: s(formData, "intro_text"),
    partner_since: s(formData, "partner_since"),
    seo_title: s(formData, "seo_title"),
    seo_description: s(formData, "seo_description"),
    is_public: formData.get("is_public") === "on",
    // Origem/rastreio: por padrão o próprio slug (o time pode não mexer nisso).
    utm_source: s(formData, "utm_source") ?? slug,
    tracking_code: s(formData, "tracking_code") ?? slug,
    updated_at: new Date().toISOString(),
  };

  let savedId = id ?? undefined;
  if (id) {
    const { error } = await admin.from("communities").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: ins, error } = await admin.from("communities").insert(record).select("id").single();
    if (error || !ins) {
      if (error?.message.includes("duplicate") || error?.code === "23505") {
        return { ok: false, error: `Já existe uma comunidade com o slug "${slug}". Escolha outro.` };
      }
      return { ok: false, error: error?.message ?? "Não foi possível criar." };
    }
    savedId = ins.id as string;
  }
  revalidatePath("/admin/comunidades");
  revalidatePath("/comunidades");
  revalidatePath(`/comunidades/${slug}`);
  return { ok: true, slug, id: savedId };
}

export async function deleteCommunityAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("communities").delete().eq("id", id);
  revalidatePath("/admin/comunidades");
  revalidatePath("/comunidades");
  redirect("/admin/comunidades");
}

export async function saveEventAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const communityId = s(formData, "community_id");
  const title = s(formData, "title");
  if (!communityId || !title) return { ok: false, error: "Informe o título do evento." };

  const record: Record<string, unknown> = {
    community_id: communityId,
    title,
    slug: slugify(s(formData, "slug") ?? title),
    theme: s(formData, "theme"),
    starts_at: s(formData, "starts_at"),
    timezone: s(formData, "timezone") ?? "America/Sao_Paulo",
    description: s(formData, "description"),
    speaker: s(formData, "speaker"),
    signup_url: s(formData, "signup_url"),
    recording_url: s(formData, "recording_url"),
    status: s(formData, "status") ?? "proximo",
    is_public: formData.get("is_public") !== "off",
  };
  const id = s(formData, "id");
  if (id) {
    const { error } = await admin.from("community_events").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin.from("community_events").insert(record);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/comunidades");
  return { ok: true };
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("community_events").delete().eq("id", id);
  revalidatePath("/admin/comunidades");
}

/** Substitui a curadoria de psicólogos de uma comunidade (na ordem enviada). */
export async function saveCommunityPsychologistsAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const communityId = s(formData, "community_id");
  if (!communityId) return { ok: false, error: "Comunidade não identificada." };
  const ids = (formData.getAll("psychologist_ids") as string[]).filter(Boolean);
  await admin.from("community_psychologists").delete().eq("community_id", communityId);
  if (ids.length) {
    const { error } = await admin
      .from("community_psychologists")
      .insert(ids.map((psychologist_id, i) => ({ community_id: communityId, psychologist_id, sort_order: i })));
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath("/admin/comunidades");
  return { ok: true };
}

/** Cria (ou reaproveita) o acesso de leitura do responsável pela comunidade. */
export async function createCommunityManagerAction(formData: FormData): Promise<{ ok: boolean; error?: string; email?: string; password?: string; created?: boolean }> {
  await requireAdmin();
  const admin = createAdminClient();
  const communityId = s(formData, "community_id");
  const email = (s(formData, "manager_email") ?? "").toLowerCase();
  const name = s(formData, "manager_name");
  if (!communityId) return { ok: false, error: "Comunidade não identificada." };
  if (!email || !email.includes("@")) return { ok: false, error: "Informe um e-mail válido." };

  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 });
  let user = (list?.users ?? []).find((u) => (u.email || "").toLowerCase() === email) ?? null;
  let password: string | undefined;
  let created = false;

  if (!user) {
    password = `ayumana${new Date().getFullYear()}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || null },
    });
    if (error || !data.user) return { ok: false, error: `Não foi possível criar o acesso: ${error?.message ?? "erro"}` };
    user = data.user;
    created = true;
    // Usuário novo é criado JÁ como responsável de comunidade.
    await admin.from("profiles").upsert({ id: user.id, email, full_name: name || null, role: "comunidade" }, { onConflict: "id" });
  }
  // Para usuário existente, não mexemos no papel dele (pode ser psicólogo/admin).

  const { error: linkErr } = await admin.from("community_managers").upsert({ community_id: communityId, profile_id: user.id });
  if (linkErr) return { ok: false, error: linkErr.message };

  revalidatePath(`/admin/comunidades/${communityId}`);
  return { ok: true, email, password, created };
}

/** Remove o acesso de um responsável. */
export async function removeCommunityManagerAction(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  const communityId = String(formData.get("community_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  if (!communityId || !profileId) return;
  await admin.from("community_managers").delete().eq("community_id", communityId).eq("profile_id", profileId);
  revalidatePath(`/admin/comunidades/${communityId}`);
}

/** Marca um lead institucional como tratado / não tratado. */
export async function toggleLeadHandledAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const handled = String(formData.get("handled") ?? "") === "1";
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("community_leads").update({ handled }).eq("id", id);
  revalidatePath("/admin/comunidades/leads");
}

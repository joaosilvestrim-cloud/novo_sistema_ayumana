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

export async function saveCommunityAction(formData: FormData): Promise<{ ok: boolean; error?: string; slug?: string }> {
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

  const record: Record<string, unknown> = {
    name,
    slug,
    country_code: country,
    city_region: s(formData, "city_region"),
    type: s(formData, "type") ?? "associacao",
    status: s(formData, "status") ?? "prospect",
    logo_url: s(formData, "logo_url"),
    cover_image_url: s(formData, "cover_image_url"),
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

  if (id) {
    const { error } = await admin.from("communities").update(record).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin.from("communities").insert(record);
    if (error) {
      if (error.message.includes("duplicate") || error.code === "23505") {
        return { ok: false, error: `Já existe uma comunidade com o slug "${slug}". Escolha outro.` };
      }
      return { ok: false, error: error.message };
    }
  }
  revalidatePath("/admin/comunidades");
  revalidatePath("/comunidades");
  revalidatePath(`/comunidades/${slug}`);
  return { ok: true, slug };
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
    theme: s(formData, "theme"),
    starts_at: s(formData, "starts_at"),
    timezone: s(formData, "timezone") ?? "America/Sao_Paulo",
    description: s(formData, "description"),
    speaker: s(formData, "speaker"),
    signup_url: s(formData, "signup_url"),
    recording_url: s(formData, "recording_url"),
    status: s(formData, "status") ?? "proximo",
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

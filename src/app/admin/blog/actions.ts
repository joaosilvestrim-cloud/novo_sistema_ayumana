"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

export type BlogFormState = { error: string | null };

export async function savePostAction(
  _prev: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title || !content) return { error: "Título e conteúdo são obrigatórios." };

  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugInput ? slugify(slugInput) : slugify(title);
  const published = formData.get("published") === "on";

  const admin = createAdminClient();

  // Capa: usa upload se houver arquivo, senão mantém a URL atual.
  let coverUrl = String(formData.get("cover_url") ?? "").trim() || null;
  const coverFile = formData.get("cover_file") as File | null;
  if (coverFile && coverFile.size > 0) {
    if (coverFile.size > 8 * 1024 * 1024) {
      return { error: "A imagem de capa excede 8 MB." };
    }
    const ext = (coverFile.name.split(".").pop() || "jpg").toLowerCase();
    const path = `capas/${slug}-${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from("blog-images")
      .upload(path, coverFile, { upsert: true, contentType: coverFile.type });
    if (upErr) return { error: `Falha ao enviar a capa: ${upErr.message}` };
    coverUrl = admin.storage.from("blog-images").getPublicUrl(path).data.publicUrl;
  }

  const payload: Record<string, unknown> = {
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content,
    category: String(formData.get("category") ?? "geral").trim() || "geral",
    author_name: String(formData.get("author_name") ?? "Equipe Ayumana").trim(),
    cover_url: coverUrl,
    published,
  };

  if (id) {
    // Ao publicar pela 1ª vez, carimba a data.
    const { data: existing } = await admin
      .from("blog_posts")
      .select("published_at")
      .eq("id", id)
      .single();
    if (published && !existing?.published_at) {
      payload.published_at = new Date().toISOString();
    }
    const { error } = await admin.from("blog_posts").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    if (published) payload.published_at = new Date().toISOString();
    const { error } = await admin.from("blog_posts").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deletePostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  await admin.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

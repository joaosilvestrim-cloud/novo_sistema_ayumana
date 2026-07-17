import { createClient } from "@/lib/supabase/server";
import type { BlogPost } from "@/lib/types";

export type BlogFilters = { q?: string; category?: string };

export async function listPosts(limit = 50, filters?: BlogFilters): Promise<BlogPost[]> {
  const supabase = await createClient();
  let query = supabase.from("blog_posts").select("*").eq("published", true);

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.q) {
    const q = filters.q.replace(/[%,]/g, " ").trim();
    query = query.or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`);
  }

  const { data } = await query
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data as BlogPost[]) ?? [];
}

/** Categorias distintas com contagem (só publicados). */
export async function getCategories(): Promise<{ category: string; count: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("published", true);
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const c = (r as { category: string }).category || "geral";
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as BlogPost) ?? null;
}

import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { COUNTRY_LANDINGS } from "@/lib/countries-content";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const [{ data: psys }, { data: posts }, { data: questions }] = await Promise.all([
    supabase.from("psychologists").select("slug, updated_at").eq("is_published", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("published", true),
    supabase.from("forum_questions").select("slug, published_at").eq("status", "publicada"),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/psicologos",
    "/perguntas",
    "/blog",
    "/para-psicologos",
    "/privacidade",
    "/termos",
  ].map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const countryRoutes: MetadataRoute.Sitemap = COUNTRY_LANDINGS.map((c) => ({
    url: `${BASE}/no-exterior/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const psyRoutes: MetadataRoute.Sitemap = (psys ?? [])
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${BASE}/psicologo/${p.slug}`,
      lastModified: p.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const questionRoutes: MetadataRoute.Sitemap = (questions ?? []).map((q) => ({
    url: `${BASE}/perguntas/${q.slug}`,
    lastModified: q.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...countryRoutes,
    ...psyRoutes,
    ...postRoutes,
    ...questionRoutes,
  ];
}

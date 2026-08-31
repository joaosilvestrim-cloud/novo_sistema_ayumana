import { createClient } from "@/lib/supabase/server";

export type CommunityStatus = "prospect" | "negotiating" | "active" | "paused" | "closed";
export type CommunityType = "associacao" | "grupo" | "centro_cultural" | "rede" | "conselho" | "outro";

export type Community = {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  city_region: string | null;
  type: CommunityType;
  status: CommunityStatus;
  logo_url: string | null;
  cover_image_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  contact_email: string | null;
  contact_name: string | null;
  headline: string | null;
  intro_text: string | null;
  partner_since: string | null;
  utm_source: string | null;
  tracking_code: string | null;
  is_public: boolean;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityEvent = {
  id: string;
  community_id: string;
  title: string;
  theme: string | null;
  starts_at: string | null;
  timezone: string | null;
  description: string | null;
  speaker: string | null;
  signup_url: string | null;
  recording_url: string | null;
  status: "proximo" | "realizado" | "cancelado";
  created_at: string;
};

export const COMMUNITY_TYPE_LABEL: Record<CommunityType, string> = {
  associacao: "Associação",
  grupo: "Grupo",
  centro_cultural: "Centro cultural",
  rede: "Rede",
  conselho: "Conselho",
  outro: "Outro",
};

/** Comunidades publicadas, para o hub /comunidades. */
export async function listPublicCommunities(): Promise<Community[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("is_public", true)
    .order("name");
  return (data as Community[] | null) ?? [];
}

/** Uma comunidade publicada pelo slug (landing pública). */
export async function getPublicCommunity(slug: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  return (data as Community | null) ?? null;
}

/** Eventos de uma comunidade (mais próximos primeiro). */
export async function listCommunityEvents(communityId: string): Promise<CommunityEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_events")
    .select("*")
    .eq("community_id", communityId)
    .neq("status", "cancelado")
    .order("starts_at", { ascending: true, nullsFirst: false });
  return (data as CommunityEvent[] | null) ?? [];
}

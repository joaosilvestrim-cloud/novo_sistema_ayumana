import { createClient } from "@/lib/supabase/server";
import type { Community, CommunityEvent } from "@/lib/communities-types";

export type { Community, CommunityEvent, CommunityStatus, CommunityType } from "@/lib/communities-types";
export { COMMUNITY_TYPE_LABEL } from "@/lib/communities-types";

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

/** Comunidades publicadas de um país (bloco nas páginas de país). */
export async function listCommunitiesByCountry(code: string): Promise<Community[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("is_public", true)
    .eq("country_code", code)
    .order("name");
  return (data as Community[] | null) ?? [];
}

/** IDs dos psicólogos curados de uma comunidade, na ordem definida. */
export async function listCuratedPsychologistIds(communityId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_psychologists")
    .select("psychologist_id")
    .eq("community_id", communityId)
    .order("sort_order");
  return ((data as { psychologist_id: string }[] | null) ?? []).map((r) => r.psychologist_id);
}

/** Um evento de comunidade pelo slug (página própria do evento). */
export async function getCommunityEventBySlug(communityId: string, eventSlug: string): Promise<CommunityEvent | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_events")
    .select("*")
    .eq("community_id", communityId)
    .eq("slug", eventSlug)
    .eq("is_public", true)
    .maybeSingle();
  return (data as CommunityEvent | null) ?? null;
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

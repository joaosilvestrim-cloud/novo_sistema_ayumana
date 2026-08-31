// Tipos e rótulos das comunidades. SEM imports de servidor, para poder ser usado
// tanto em Server quanto em Client Components. As funções de leitura (que usam o
// Supabase de servidor) ficam em ./communities.

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
  themes: string[];
  created_at: string;
  updated_at: string;
};

export type CommunityEvent = {
  id: string;
  community_id: string;
  title: string;
  slug: string | null;
  theme: string | null;
  starts_at: string | null;
  timezone: string | null;
  description: string | null;
  speaker: string | null;
  signup_url: string | null;
  recording_url: string | null;
  status: "proximo" | "realizado" | "cancelado";
  is_public: boolean;
  created_at: string;
};

/** Lead institucional (líder de comunidade interessado na parceria). */
export type CommunityLead = {
  id: string;
  community_name: string | null;
  country_code: string | null;
  contact_name: string | null;
  contact_email: string | null;
  message: string | null;
  source_slug: string | null;
  handled: boolean;
  created_at: string;
};

/** Temas padrão sugeridos para os encontros. */
export const COMMUNITY_THEMES = [
  "Ansiedade", "Saudade", "Adaptação", "Maternidade longe da rede de apoio",
  "Relacionamentos", "Filhos entre culturas", "Burnout", "Pertencimento",
  "Solidão", "Carreira no exterior", "Luto migratório", "Documentação e incerteza",
] as const;

export const COMMUNITY_TYPE_LABEL: Record<CommunityType, string> = {
  associacao: "Associação",
  grupo: "Grupo",
  centro_cultural: "Centro cultural",
  rede: "Rede",
  conselho: "Conselho",
  outro: "Outro",
};

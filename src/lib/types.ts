// Tipos do domínio Ayumana (espelham a migration 0001).

export type UserRole = "psicologo" | "admin";
export type PlanTier = "essencial" | "destaque" | "ideal" | "presenca";
export type VerificationStatus =
  | "nao_enviado"
  | "pendente"
  | "aprovado"
  | "reprovado";
export type Gender =
  | "feminino"
  | "masculino"
  | "nao_binario"
  | "outro"
  | "prefiro_nao_dizer";
export type Audience = "crianca" | "adolescente" | "adulto" | "idoso" | "casal";
export type SubscriptionStatus = "nenhuma" | "ativa" | "atrasada" | "cancelada";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Plan = {
  id: PlanTier;
  name: string;
  price_cents: number;
  price_label: string | null;
  search_priority: number;
  features: string[];
  is_selfservice: boolean;
  sort_order: number;
};

export type Approach = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
};

export type Specialty = {
  id: number;
  slug: string;
  name: string;
  category: string;
  sort_order: number;
};

export type Psychologist = {
  id: string;
  profile_id: string;
  slug: string | null;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  gender: Gender | null;
  crp_number: string | null;
  crp_uf: string | null;
  crp_document_path: string | null;
  verification_status: VerificationStatus;
  verification_notes: string | null;
  verification_submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  plan_tier: PlanTier;
  city: string | null;
  state: string | null;
  country: string;
  phone_whatsapp: string | null;
  whatsapp_message: string | null;
  session_price_cents: number | null;
  video_url: string | null;
  accepts_online: boolean;
  accepts_in_person: boolean;
  attends_abroad: boolean;
  audiences: Audience[];
  languages: string[];
  timezones: string[];
  profile_completed: boolean;
  is_published: boolean;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export const SUBSCRIPTION_LABELS: Record<
  SubscriptionStatus,
  { label: string; tone: "neutral" | "warning" | "success" | "danger" }
> = {
  nenhuma: { label: "Sem assinatura", tone: "neutral" },
  ativa: { label: "Ativa", tone: "success" },
  atrasada: { label: "Pagamento pendente", tone: "warning" },
  cancelada: { label: "Cancelada", tone: "danger" },
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  crianca: "Crianças",
  adolescente: "Adolescentes",
  adulto: "Adultos",
  idoso: "Idosos",
  casal: "Casais",
};

export const VERIFICATION_LABELS: Record<
  VerificationStatus,
  { label: string; tone: "neutral" | "warning" | "success" | "danger" }
> = {
  nao_enviado: { label: "Não enviado", tone: "neutral" },
  pendente: { label: "Em análise", tone: "warning" },
  aprovado: { label: "Verificado", tone: "success" },
  reprovado: { label: "Reprovado", tone: "danger" },
};

export type ContentStatus = "pendente" | "publicada" | "reprovada";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  category: string;
  author_name: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ForumQuestion = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  author_alias: string;
  country_code: string | null;
  specialty_id: number | null;
  status: ContentStatus;
  created_at: string;
  published_at: string | null;
};

export type ForumAnswer = {
  id: string;
  question_id: string;
  psychologist_id: string;
  body: string;
  status: ContentStatus;
  created_at: string;
  published_at: string | null;
};

/** Países-alvo iniciais (diferencial exterior — Blueprint §4). */
export const COUNTRIES = [
  { code: "PT", name: "Portugal" },
  { code: "US", name: "Estados Unidos" },
  { code: "IE", name: "Irlanda" },
  { code: "GB", name: "Reino Unido" },
  { code: "DE", name: "Alemanha" },
  { code: "ES", name: "Espanha" },
  { code: "CA", name: "Canadá" },
  { code: "AU", name: "Austrália" },
  { code: "JP", name: "Japão" },
  { code: "NL", name: "Holanda" },
] as const;

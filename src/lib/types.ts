// Tipos do domínio Ayumana (espelham a migration 0001).

export type UserRole = "psicologo" | "admin" | "conteudo";

export type ContentStatusKey = "briefing" | "producao" | "revisao" | "ajustes" | "aprovado" | "entregue";
export type ContentFormat = "post" | "story" | "reel" | "carrossel" | "outro";

export type ContentItem = {
  id: string;
  psychologist_id: string;
  cycle: string; // 'YYYY-MM'
  title: string;
  format: ContentFormat;
  status: ContentStatusKey;
  brief: string | null;
  asset_url: string | null;
  feedback: string | null;
  assigned_to: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  caption: string | null;
  hashtags: string | null;
  requested_by: string | null;
  approved_at: string | null;
  delivered_at: string | null;
  psy_seen_at: string | null;
  studio_seen_at: string | null;
  last_touch_by: "psicologo" | "estudio" | null;
};

export type ContentComment = {
  id: string;
  item_id: string;
  author_id: string | null;
  author_name: string | null;
  author_side: "psicologo" | "estudio";
  body: string;
  kind: "mensagem" | "aprovacao" | "ajuste" | "sistema";
  created_at: string;
};

export type ContentVersion = {
  id: string;
  item_id: string;
  version: number;
  url: string;
  mime: string | null;
  uploaded_by: string | null;
  note: string | null;
  created_at: string;
};

/**
 * Quem está com a bola em cada etapa. É o que organiza a tela do psicólogo:
 * ele não quer saber de "produção" ou "ajustes", quer saber se precisa agir.
 */
export type ContentSide = "estudio" | "psicologo" | "pronto";

export const CONTENT_STATUS: {
  key: ContentStatusKey;
  label: string;
  tone: "neutral" | "warning" | "success" | "brand";
  side: ContentSide;
  /** Como o psicólogo lê essa etapa. */
  psyLabel: string;
  hint: string;
}[] = [
  { key: "briefing", label: "Briefing", tone: "neutral", side: "estudio", psyLabel: "Na fila", hint: "Definindo o tema e a linha da peça" },
  { key: "producao", label: "Em produção", tone: "brand", side: "estudio", psyLabel: "Sendo criada", hint: "A equipe está desenhando a arte" },
  { key: "revisao", label: "Com o psicólogo", tone: "warning", side: "psicologo", psyLabel: "Esperando você", hint: "Dê o aval ou peça um ajuste" },
  { key: "ajustes", label: "Ajustando", tone: "warning", side: "estudio", psyLabel: "Ajustando", hint: "Aplicando o que você pediu" },
  { key: "aprovado", label: "Aprovado", tone: "success", side: "estudio", psyLabel: "Aprovada", hint: "Fechando os arquivos finais" },
  { key: "entregue", label: "Entregue", tone: "success", side: "pronto", psyLabel: "Pronta para publicar", hint: "Baixe e publique quando quiser" },
];

export const CONTENT_STATUS_MAP = Object.fromEntries(
  CONTENT_STATUS.map((s) => [s.key, s])
) as Record<ContentStatusKey, (typeof CONTENT_STATUS)[number]>;

export const CONTENT_FORMAT_LABEL: Record<ContentFormat, string> = {
  post: "Post",
  story: "Story",
  reel: "Reel",
  carrossel: "Carrossel",
  outro: "Outro",
};
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
  avatar_url: string | null;
  instagram: string | null;
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
  session_price_in_person_cents: number | null;
  video_url: string | null;
  audio_url: string | null;
  gallery_urls: string[];
  accepts_online: boolean;
  accepts_in_person: boolean;
  attends_abroad: boolean;
  audiences: Audience[];
  languages: string[];
  timezones: string[];
  timezone: string;
  schedule: Record<string, { open: string; close: string } | null> | null;
  accepting_patients: boolean;
  formation: string | null;
  services: string[];
  style: Record<string, number> | null;
  profile_completed: boolean;
  is_published: boolean;
  asaas_customer_id: string | null;
  asaas_subscription_id: string | null;
  trial_tier: PlanTier | null;
  trial_ends_at: string | null;
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

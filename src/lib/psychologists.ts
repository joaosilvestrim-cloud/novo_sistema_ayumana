import { createClient } from "@/lib/supabase/server";
import { effectivePlan } from "@/lib/plan-features";
import type { Audience, Gender, PlanTier, Psychologist } from "@/lib/types";

export type PsychologistCard = Psychologist & {
  specialties: { id: number; name: string; slug: string; category: string }[];
  approaches: { id: number; name: string; slug: string }[];
  countries: string[];
};

export type CatalogFilters = {
  q?: string;
  especialidade?: string; // slug
  abordagem?: string; // slug
  publico?: Audience;
  formato?: "online" | "presencial";
  exterior?: boolean;
  genero?: Gender;
  precoMax?: number; // em reais
  pais?: string; // country code
  page?: number;
};

const PAGE_SIZE = 12;

const PLAN_PRIORITY: Record<PlanTier, number> = {
  presenca: 30,
  ideal: 20,
  destaque: 10,
  essencial: 0,
};

const SELECT = `
  *,
  specialties:psychologist_specialties(specialty:specialties(id,name,slug,category)),
  approaches:psychologist_approaches(approach:approaches(id,name,slug)),
  countries:psychologist_countries(country_code)
`;

type RawRow = Psychologist & {
  specialties: { specialty: PsychologistCard["specialties"][number] | null }[] | null;
  approaches: { approach: PsychologistCard["approaches"][number] | null }[] | null;
  countries: { country_code: string }[] | null;
};

export type HeroPerson = {
  name: string | null;
  role: string;
  place: string;
  avatar_url: string | null;
  slug: string | null;
};

type HeroRow = {
  slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  plan_tier: PlanTier;
  approaches: { approach: { name: string } | null }[] | null;
};

const HERO_FIELDS =
  "slug, display_name, avatar_url, city, state, plan_tier, approaches:psychologist_approaches(approach:approaches(name))";

/**
 * Pool de profissionais reais para a animação da home (a home rotaciona entre eles).
 * TODOS os IDEAL publicados com foto entram; se sobrar espaço, completa com outros.
 */
export async function listHeroPeople(limit = 12): Promise<HeroPerson[]> {
  const supabase = await createClient();

  // 1) Todos os IDEAL publicados com foto (têm prioridade e passam pela animação).
  const { data: ideal } = await supabase
    .from("psychologists")
    .select(HERO_FIELDS)
    .eq("is_published", true)
    .not("avatar_url", "is", null)
    .eq("plan_tier", "ideal")
    .limit(limit);

  let rows = (ideal ?? []) as unknown as HeroRow[];

  // 2) Se houver poucos IDEAL, completa com outros publicados com foto (planos pagos primeiro).
  if (rows.length < Math.min(limit, 6)) {
    const { data: others } = await supabase
      .from("psychologists")
      .select(HERO_FIELDS)
      .eq("is_published", true)
      .not("avatar_url", "is", null)
      .neq("plan_tier", "ideal")
      .limit(40);
    const extra = ((others ?? []) as unknown as HeroRow[]).sort(
      (a, b) => (PLAN_PRIORITY[b.plan_tier] ?? 0) - (PLAN_PRIORITY[a.plan_tier] ?? 0)
    );
    rows = [...rows, ...extra].slice(0, limit);
  }

  return rows.map((r) => ({
    name: r.display_name,
    role: r.approaches?.[0]?.approach?.name ?? "Psicólogo(a)",
    place: [r.city, r.state].filter(Boolean).join(" / ") || "Online",
    avatar_url: r.avatar_url,
    slug: r.slug,
  }));
}

function shape(row: RawRow): PsychologistCard {
  return {
    ...(row as Psychologist),
    specialties: (row.specialties ?? [])
      .map((s) => s.specialty)
      .filter((s): s is PsychologistCard["specialties"][number] => !!s),
    approaches: (row.approaches ?? [])
      .map((a) => a.approach)
      .filter((a): a is PsychologistCard["approaches"][number] => !!a),
    countries: (row.countries ?? []).map((c) => c.country_code),
  };
}

/** Resolve os ids de psicólogos que batem com um filtro de tabela-ponte. */
async function idsBySpecialtySlug(slug: string): Promise<string[] | null> {
  const supabase = await createClient();
  const { data: spec } = await supabase
    .from("specialties")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!spec) return [];
  const { data } = await supabase
    .from("psychologist_specialties")
    .select("psychologist_id")
    .eq("specialty_id", spec.id);
  return (data ?? []).map((r) => r.psychologist_id);
}

async function idsByApproachSlug(slug: string): Promise<string[] | null> {
  const supabase = await createClient();
  const { data: appr } = await supabase
    .from("approaches")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!appr) return [];
  const { data } = await supabase
    .from("psychologist_approaches")
    .select("psychologist_id")
    .eq("approach_id", appr.id);
  return (data ?? []).map((r) => r.psychologist_id);
}

function intersect(a: string[] | null, b: string[] | null): string[] | null {
  if (a === null) return b;
  if (b === null) return a;
  const set = new Set(a);
  return b.filter((x) => set.has(x));
}

/** Qualidade do perfil, 0 a 1. Premia quem investiu (foto, apresentação, temas). */
function qualidadePerfil(p: PsychologistCard): number {
  let s = 0;
  let max = 0;
  const add = (peso: number, ok: boolean) => { max += peso; if (ok) s += peso; };
  add(3, !!p.avatar_url); // foto é o maior sinal
  add(2, !!(p.headline && p.headline.trim()));
  add(2, !!(p.bio && p.bio.replace(/<[^>]*>/g, "").trim()));
  add(2, (p.specialties?.length ?? 0) > 0);
  add(1, (p.approaches?.length ?? 0) > 0);
  add(1, !!p.video_url);
  add(1, !!(p.session_price_cents && p.session_price_cents > 0));
  return max ? s / max : 0;
}

/** Pseudo-aleatório determinístico por (id + dia). 0 a 1. Gira a cada dia. */
function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Posição DENTRO da faixa de plano: metade qualidade do perfil, metade rotação
 * do dia. Assim quem caprichou sobe, e mesmo assim todos giram e têm sua vez na
 * página 1 ao longo da semana. A faixa de plano continua mandando (monetização).
 */
function scoreDentroDaFaixa(p: PsychologistCard, dia: string): number {
  return qualidadePerfil(p) * 0.5 + hash01((p.id ?? "") + dia) * 0.5;
}

export async function listPsychologists(filters: CatalogFilters): Promise<{
  rows: PsychologistCard[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);

  // Filtros por tabela-ponte → conjunto de ids.
  let idSet: string[] | null = null;
  if (filters.especialidade) {
    idSet = intersect(idSet, await idsBySpecialtySlug(filters.especialidade));
  }
  if (filters.abordagem) {
    idSet = intersect(idSet, await idsByApproachSlug(filters.abordagem));
  }
  // Nenhum resultado possível.
  if (idSet !== null && idSet.length === 0) {
    return { rows: [], total: 0, page, pageSize: PAGE_SIZE };
  }

  let query = supabase
    .from("psychologists")
    .select(SELECT, { count: "exact" })
    .eq("is_published", true);

  if (idSet !== null) query = query.in("id", idSet);
  if (filters.q) {
    // Busca por palavras: cada termo precisa aparecer no nome de exibição, no
    // título ou na bio. Assim "ana souza" acha "Ana Paula Souza", em qualquer
    // ordem e mesmo com uma palavra no meio (a busca de frase inteira falhava).
    const termos = filters.q
      .replace(/[%,()]/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);
    for (const termo of termos) {
      query = query.or(
        `display_name.ilike.%${termo}%,headline.ilike.%${termo}%,bio.ilike.%${termo}%`
      );
    }
  }
  if (filters.exterior) query = query.eq("attends_abroad", true);
  if (filters.formato === "online") query = query.eq("accepts_online", true);
  if (filters.formato === "presencial") query = query.eq("accepts_in_person", true);
  if (filters.genero) query = query.eq("gender", filters.genero);
  if (filters.publico) query = query.contains("audiences", [filters.publico]);
  if (typeof filters.precoMax === "number") {
    query = query.lte("session_price_cents", filters.precoMax * 100);
  }

  const { data, count } = await query;
  let rows = ((data as RawRow[] | null) ?? []).map(shape);

  // Filtro por país atendido (join countries).
  if (filters.pais) {
    rows = rows.filter((r) => r.countries.includes(filters.pais!));
  }

  // Ordena por prioridade do plano EFETIVO (pagos sempre na frente: monetização).
  // Dentro da mesma faixa, combina qualidade do perfil com uma rotação diária,
  // para dar chance a todos ao longo da semana sem tirar a vez dos pagos.
  const dia = new Date().toISOString().slice(0, 10);
  rows.sort((a, b) => {
    const pa = PLAN_PRIORITY[effectivePlan(a)] ?? 0;
    const pb = PLAN_PRIORITY[effectivePlan(b)] ?? 0;
    if (pb !== pa) return pb - pa;
    return scoreDentroDaFaixa(b, dia) - scoreDentroDaFaixa(a, dia);
  });

  const total = filters.pais ? rows.length : count ?? rows.length;
  const start = (page - 1) * PAGE_SIZE;
  const paged = rows.slice(start, start + PAGE_SIZE);

  return { rows: paged, total, page, pageSize: PAGE_SIZE };
}

/**
 * Amostra rotativa para a faixa "Conheça também": psicólogos publicados com
 * foto, embaralhados por dia. Dá palco a quem estaria enterrado nas páginas de
 * trás. Gira todo dia, então todos passam por aqui ao longo do tempo.
 */
export async function listDiscovery(count = 4): Promise<PsychologistCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("psychologists")
    .select(SELECT)
    .eq("is_published", true)
    .not("avatar_url", "is", null)
    .limit(300);
  const rows = ((data as RawRow[] | null) ?? []).map(shape);
  const dia = new Date().toISOString().slice(0, 10);
  rows.sort((a, b) => hash01((a.id ?? "") + dia + "disc") - hash01((b.id ?? "") + dia + "disc"));
  return rows.slice(0, count);
}

export async function getPsychologistBySlug(
  slug: string
): Promise<PsychologistCard | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("psychologists")
    .select(SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  return shape(data as RawRow);
}

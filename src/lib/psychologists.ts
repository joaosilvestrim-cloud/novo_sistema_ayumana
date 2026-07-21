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
    const q = filters.q.replace(/[%,]/g, " ").trim();
    query = query.or(
      `display_name.ilike.%${q}%,headline.ilike.%${q}%,bio.ilike.%${q}%`
    );
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

  // Ordena por prioridade do plano EFETIVO (o teste gratuito conta) e depois
  // por mais recente.
  rows.sort((a, b) => {
    const pa = PLAN_PRIORITY[effectivePlan(a)] ?? 0;
    const pb = PLAN_PRIORITY[effectivePlan(b)] ?? 0;
    if (pb !== pa) return pb - pa;
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });

  const total = filters.pais ? rows.length : count ?? rows.length;
  const start = (page - 1) * PAGE_SIZE;
  const paged = rows.slice(start, start + PAGE_SIZE);

  return { rows: paged, total, page, pageSize: PAGE_SIZE };
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

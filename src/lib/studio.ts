import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CONTENT_STATUS_MAP,
  type ContentComment,
  type ContentItem,
  type ContentStatusKey,
  type ContentVersion,
} from "@/lib/types";

/** Competência atual no formato 'YYYY-MM'. */
export function currentCycle(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Rótulo amigável da competência (ex.: 'jul/2026'). */
export function cycleLabel(cycle: string): string {
  const [y, m] = cycle.split("-").map(Number);
  if (!y || !m) return cycle;
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${meses[m - 1]}/${y}`;
}

export const PECAS_POR_CICLO = 8;

export type StudioClient = {
  id: string;
  display_name: string | null;
  slug: string | null;
  avatar_url: string | null;
  city: string | null;
  total: number;
  entregues: number;
  emAndamento: number;
  /** Peças paradas esperando o psicólogo decidir. */
  comOPsicologo: number;
  /** Mensagens do psicólogo que o estúdio ainda não leu. */
  naoLidas: number;
  /** Peças fora do prazo. */
  atrasadas: number;
};

/** Psicólogos do plano Presença + progresso do ciclo atual. */
export async function listStudioClients(cycle = currentCycle()): Promise<StudioClient[]> {
  const admin = createAdminClient();
  const { data: psys } = await admin
    .from("psychologists")
    .select("id, display_name, slug, avatar_url, city")
    .eq("plan_tier", "presenca")
    .order("display_name");

  const list = (psys ?? []) as { id: string; display_name: string | null; slug: string | null; avatar_url: string | null; city: string | null }[];
  if (list.length === 0) return [];

  const { data: items } = await admin
    .from("content_items")
    .select("id, psychologist_id, status, due_date, studio_seen_at")
    .eq("cycle", cycle)
    .in("psychologist_id", list.map((p) => p.id));

  type Linha = {
    id: string;
    psychologist_id: string;
    status: ContentStatusKey;
    due_date: string | null;
    studio_seen_at: string | null;
  };
  const linhas = (items ?? []) as Linha[];

  // Mensagens do psicólogo ainda não lidas pelo estúdio, em uma consulta só.
  const naoLidasPorPsy = new Map<string, number>();
  if (linhas.length) {
    const { data: msgs } = await admin
      .from("content_comments")
      .select("item_id, created_at")
      .eq("author_side", "psicologo")
      .in("item_id", linhas.map((l) => l.id));

    const porItem = new Map(linhas.map((l) => [l.id, l]));
    for (const m of (msgs ?? []) as { item_id: string; created_at: string }[]) {
      const linha = porItem.get(m.item_id);
      if (!linha) continue;
      if (linha.studio_seen_at && new Date(m.created_at) <= new Date(linha.studio_seen_at)) continue;
      naoLidasPorPsy.set(linha.psychologist_id, (naoLidasPorPsy.get(linha.psychologist_id) ?? 0) + 1);
    }
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const byPsy = new Map<string, { total: number; entregues: number; emAndamento: number; comOPsicologo: number; atrasadas: number }>();
  for (const it of linhas) {
    const cur =
      byPsy.get(it.psychologist_id) ??
      { total: 0, entregues: 0, emAndamento: 0, comOPsicologo: 0, atrasadas: 0 };
    cur.total++;
    if (it.status === "entregue") cur.entregues++;
    else {
      cur.emAndamento++;
      if (it.due_date && it.due_date < hoje) cur.atrasadas++;
    }
    if (CONTENT_STATUS_MAP[it.status]?.side === "psicologo") cur.comOPsicologo++;
    byPsy.set(it.psychologist_id, cur);
  }

  return list.map((p) => {
    const n = byPsy.get(p.id);
    return {
      ...p,
      total: n?.total ?? 0,
      entregues: n?.entregues ?? 0,
      emAndamento: n?.emAndamento ?? 0,
      comOPsicologo: n?.comOPsicologo ?? 0,
      atrasadas: n?.atrasadas ?? 0,
      naoLidas: naoLidasPorPsy.get(p.id) ?? 0,
    };
  });
}

export async function getStudioClient(psyId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("psychologists")
    .select("id, display_name, slug, avatar_url, city, instagram")
    .eq("id", psyId)
    .maybeSingle();
  return data as { id: string; display_name: string | null; slug: string | null; avatar_url: string | null; city: string | null; instagram: string | null } | null;
}

export async function listItems(psyId: string, cycle: string): Promise<ContentItem[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("content_items")
    .select("*")
    .eq("psychologist_id", psyId)
    .eq("cycle", cycle)
    .order("position")
    .order("created_at");
  return (data as ContentItem[]) ?? [];
}

/** Competências existentes para um cliente (para o seletor de mês). */
export async function listCycles(psyId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("content_items").select("cycle").eq("psychologist_id", psyId);
  const set = new Set<string>((data ?? []).map((r: { cycle: string }) => r.cycle));
  set.add(currentCycle());
  return [...set].sort((a, b) => b.localeCompare(a));
}

/** Peça com o que a tela precisa: conversa, versões e sinais de atenção. */
export type ItemDetail = ContentItem & {
  comments: ContentComment[];
  versions: ContentVersion[];
  /** Mensagens novas desde a última visita de cada lado. */
  novasParaEstudio: number;
  novasParaPsicologo: number;
  /** Dias parada na etapa atual. */
  diasParada: number;
  /** Dias até o prazo. Negativo = atrasada. Null = sem prazo. */
  diasPrazo: number | null;
};

function dias(desde: string | null | undefined): number {
  if (!desde) return 0;
  return Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000);
}

/** Peças de um ciclo já com conversa e versões, em uma ida só ao banco. */
export async function listItemsDetailed(psyId: string, cycle: string): Promise<ItemDetail[]> {
  const admin = createAdminClient();
  const { data: itens } = await admin
    .from("content_items")
    .select("*")
    .eq("psychologist_id", psyId)
    .eq("cycle", cycle)
    .order("position")
    .order("created_at");

  const items = (itens as ContentItem[]) ?? [];
  if (!items.length) return [];
  const ids = items.map((i) => i.id);

  const [{ data: cms }, { data: vers }] = await Promise.all([
    admin.from("content_comments").select("*").in("item_id", ids).order("created_at"),
    admin.from("content_versions").select("*").in("item_id", ids).order("version", { ascending: false }),
  ]);

  const comments = (cms as ContentComment[]) ?? [];
  const versions = (vers as ContentVersion[]) ?? [];

  return items.map((it) => {
    const c = comments.filter((x) => x.item_id === it.id);
    const v = versions.filter((x) => x.item_id === it.id);
    const depois = (marca: string | null, lado: "psicologo" | "estudio") =>
      c.filter(
        (m) => m.author_side === lado && (!marca || new Date(m.created_at) > new Date(marca))
      ).length;

    return {
      ...it,
      comments: c,
      versions: v,
      novasParaEstudio: depois(it.studio_seen_at, "psicologo"),
      novasParaPsicologo: depois(it.psy_seen_at, "estudio"),
      diasParada: dias(it.updated_at),
      diasPrazo: it.due_date
        ? Math.ceil((new Date(`${it.due_date}T23:59:59`).getTime() - Date.now()) / 86_400_000)
        : null,
    };
  });
}

/** De quem é a bola agora. */
export function ladoDaBola(status: ContentStatusKey) {
  return CONTENT_STATUS_MAP[status]?.side ?? "estudio";
}

/** Resumo do ciclo, usado nas duas telas. */
export function resumoCiclo(items: ItemDetail[]) {
  const comVoce = items.filter((i) => ladoDaBola(i.status) === "psicologo");
  const prontas = items.filter((i) => i.status === "entregue");
  return {
    total: items.length,
    prontas: prontas.length,
    comVoce: comVoce.length,
    emAndamento: items.length - prontas.length - comVoce.length,
    atrasadas: items.filter((i) => i.diasPrazo !== null && i.diasPrazo < 0 && i.status !== "entregue").length,
    progresso: items.length ? Math.round((prontas.length / items.length) * 100) : 0,
  };
}

/** Ciclo do psicólogo logado, a partir do profile. */
export async function psyIdFromProfile(profileId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("psychologists")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

/** Confere se a peça pertence mesmo ao psicólogo, antes de qualquer escrita. */
export async function itemPertenceAoPerfil(itemId: string, profileId: string): Promise<ContentItem | null> {
  const admin = createAdminClient();
  const { data: item } = await admin.from("content_items").select("*").eq("id", itemId).maybeSingle();
  if (!item) return null;
  const { data: psy } = await admin
    .from("psychologists")
    .select("profile_id")
    .eq("id", (item as ContentItem).psychologist_id)
    .maybeSingle();
  return psy?.profile_id === profileId ? (item as ContentItem) : null;
}

/** Números do topo do painel. */
export async function studioStats(cycle = currentCycle()) {
  const admin = createAdminClient();
  const [{ count: clientes }, { data: items }] = await Promise.all([
    admin.from("psychologists").select("id", { count: "exact", head: true }).eq("plan_tier", "presenca"),
    admin.from("content_items").select("status").eq("cycle", cycle),
  ]);
  const rows = (items ?? []) as { status: ContentStatusKey }[];
  return {
    clientes: clientes ?? 0,
    emProducao: rows.filter((r) => r.status === "producao").length,
    emRevisao: rows.filter((r) => r.status === "revisao" || r.status === "ajustes").length,
    entregues: rows.filter((r) => r.status === "entregue").length,
    total: rows.length,
  };
}

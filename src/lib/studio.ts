import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentItem, ContentStatusKey } from "@/lib/types";

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
    .select("psychologist_id, status")
    .eq("cycle", cycle)
    .in("psychologist_id", list.map((p) => p.id));

  const byPsy = new Map<string, { total: number; entregues: number; emAndamento: number }>();
  for (const it of (items ?? []) as { psychologist_id: string; status: ContentStatusKey }[]) {
    const cur = byPsy.get(it.psychologist_id) ?? { total: 0, entregues: 0, emAndamento: 0 };
    cur.total++;
    if (it.status === "entregue") cur.entregues++;
    else cur.emAndamento++;
    byPsy.set(it.psychologist_id, cur);
  }

  return list.map((p) => ({
    ...p,
    total: byPsy.get(p.id)?.total ?? 0,
    entregues: byPsy.get(p.id)?.entregues ?? 0,
    emAndamento: byPsy.get(p.id)?.emAndamento ?? 0,
  }));
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

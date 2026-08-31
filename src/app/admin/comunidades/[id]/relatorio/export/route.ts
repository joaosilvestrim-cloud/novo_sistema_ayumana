import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Ev = { type: string; path: string | null; label: string | null; utm_source: string | null; visitor: string | null; created_at: string };
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from("communities").select("slug, name").eq("id", id).maybeSingle();
  const c = data as { slug: string; name: string } | null;
  if (!c) return new NextResponse("not found", { status: 404 });

  const { data: evRaw } = await admin
    .from("analytics_events")
    .select("type, path, label, utm_source, visitor, created_at")
    .eq("community", c.slug)
    .limit(20000);
  const ev = (evRaw as Ev[] | null) ?? [];

  const views = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/comunidades/")).length;
  const perfis = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/psicologo/")).length;
  const buscas = ev.filter((e) => e.type === "pageview" && (e.path ?? "").startsWith("/psicologos")).length;
  const whats = ev.filter((e) => e.type === "click" && (e.label ?? "").includes("wa.me")).length;
  const visitantes = new Set(ev.map((e) => e.visitor).filter(Boolean)).size;
  const conv = views > 0 ? Math.round((whats / views) * 100) : 0;

  const contatos: Record<string, number> = {};
  for (const e of ev) {
    if (e.type === "click" && (e.label ?? "").includes("wa.me") && (e.path ?? "").startsWith("/psicologo/")) {
      const slug = (e.path ?? "").slice("/psicologo/".length);
      contatos[slug] = (contatos[slug] ?? 0) + 1;
    }
  }
  const slugs = Object.keys(contatos);
  const nome: Record<string, string> = {};
  if (slugs.length) {
    const { data: ps } = await admin.from("psychologists").select("slug, display_name").in("slug", slugs.slice(0, 200));
    for (const p of (ps as { slug: string; display_name: string | null }[] | null) ?? []) nome[p.slug] = p.display_name ?? p.slug;
  }

  const linhas: string[] = [];
  linhas.push(["Métrica", "Valor"].map(csvCell).join(","));
  linhas.push(["Comunidade", c.name].map(csvCell).join(","));
  linhas.push(["Visitas à página", views].map(csvCell).join(","));
  linhas.push(["Visitantes diferentes", visitantes].map(csvCell).join(","));
  linhas.push(["Buscas de psicólogo", buscas].map(csvCell).join(","));
  linhas.push(["Perfis abertos", perfis].map(csvCell).join(","));
  linhas.push(["Contatos no WhatsApp", whats].map(csvCell).join(","));
  linhas.push(["Conversão (%)", conv].map(csvCell).join(","));
  linhas.push("");
  linhas.push(["Psicólogo", "Contatos no WhatsApp"].map(csvCell).join(","));
  for (const [slug, n] of Object.entries(contatos).sort((a, b) => b[1] - a[1])) {
    linhas.push([nome[slug] ?? slug, n].map(csvCell).join(","));
  }

  const csv = "﻿" + linhas.join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${c.slug}.csv"`,
    },
  });
}

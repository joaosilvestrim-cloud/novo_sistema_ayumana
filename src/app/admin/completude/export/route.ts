import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { avaliarCompletude, type CompletudeInput } from "@/lib/profile-completeness";

function cell(v: string): string {
  const s = (v ?? "").replace(/\r?\n/g, " ").trim();
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: psysRaw }, { data: profs }, { data: apr }, { data: esp }] = await Promise.all([
    admin.from("psychologists").select(
      "id, profile_id, display_name, crp_number, crp_uf, crp_document_path, headline, bio, avatar_url, city, phone_whatsapp, session_price_cents, video_url, is_published"
    ),
    admin.from("profiles").select("id, email"),
    admin.from("psychologist_approaches").select("psychologist_id"),
    admin.from("psychologist_specialties").select("psychologist_id"),
  ]);

  const emailPor = new Map<string, string>(((profs ?? []) as { id: string; email: string | null }[]).filter((p) => p.email).map((p) => [p.id, p.email as string]));
  const comApr = new Set(((apr ?? []) as { psychologist_id: string }[]).map((r) => r.psychologist_id));
  const comEsp = new Set(((esp ?? []) as { psychologist_id: string }[]).map((r) => r.psychologist_id));

  type Row = CompletudeInput & { id: string; profile_id: string; is_published: boolean | null };
  const rows = ((psysRaw ?? []) as Omit<Row, "hasApproaches" | "hasSpecialties">[])
    .map((p) => ({ ...p, hasApproaches: comApr.has(p.id), hasSpecialties: comEsp.has(p.id) } as Row))
    .map((p) => ({ p, a: avaliarCompletude(p) }))
    .sort((x, y) => x.a.percent - y.a.percent);

  const header = ["nome", "email", "telefone", "completude", "publicado", "falta_obrigatorio", "falta_recomendado"];
  const linhas = [header.join(",")];
  for (const { p, a } of rows) {
    linhas.push([
      cell(p.display_name || ""),
      cell(emailPor.get(p.profile_id) || ""),
      cell((p.phone_whatsapp || "").replace(/\D/g, "")),
      cell(`${a.percent}%`),
      cell(p.is_published ? "sim" : "não"),
      cell(a.faltaObrigatorio.map((c) => c.label).join("; ")),
      cell(a.faltaRecomendado.map((c) => c.label).join("; ")),
    ].join(","));
  }

  const csv = "﻿" + linhas.join("\r\n");
  const hoje = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ayumana-completude-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

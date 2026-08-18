import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { VERIFICATION_LABELS, type PlanTier, type VerificationStatus } from "@/lib/types";

// Exporta os psicólogos em CSV para a campanha de reativação.
// Colunas: nome, email, telefone, plano, crp, verificacao, publicado.
// As três últimas servem para montar os segmentos A/B/C:
//   A Prontos  = verificacao "Verificado" e perfil publicado
//   B Sem CRP  = coluna crp vazia
//   C Pendente = verificacao "Pendente" ou "Reprovado"
// Só admin. Contém dados pessoais, trate o arquivo com cuidado (LGPD).

/** Escapa um campo de CSV: aspas e vírgulas viram texto seguro. */
function csvCell(value: string | null | undefined): string {
  const s = (value ?? "").replace(/\r?\n/g, " ").trim();
  if (s.includes('"') || s.includes(",") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: psys } = await admin
    .from("psychologists")
    .select("profile_id, display_name, phone_whatsapp, plan_tier, crp_number, verification_status, is_published")
    .order("display_name");

  const rows = psys ?? [];
  const ids = rows.map((r) => r.profile_id).filter(Boolean) as string[];

  const emailById = new Map<string, string>();
  const nameById = new Map<string, string>();
  if (ids.length) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    for (const p of profs ?? []) {
      if (p.email) emailById.set(p.id, p.email as string);
      if (p.full_name) nameById.set(p.id, p.full_name as string);
    }
  }

  const header = ["nome", "email", "telefone", "plano", "crp", "verificacao", "publicado"];
  const lines = [header.join(",")];

  for (const r of rows) {
    const nome = nameById.get(r.profile_id) || r.display_name || "";
    const email = emailById.get(r.profile_id) || "";
    // Telefone só com dígitos, formato que o Kommo/WhatsApp aceita.
    const tel = (r.phone_whatsapp || "").replace(/\D/g, "");
    const plano = PLAN_LABEL[r.plan_tier as PlanTier] ?? r.plan_tier ?? "";
    const crp = r.crp_number || "";
    const verif = r.verification_status
      ? VERIFICATION_LABELS[r.verification_status as VerificationStatus]?.label ?? r.verification_status
      : "";
    const publicado = r.is_published ? "sim" : "não";
    lines.push(
      [csvCell(nome), csvCell(email), csvCell(tel), csvCell(plano), csvCell(crp), csvCell(verif), csvCell(publicado)].join(",")
    );
  }

  // BOM para o Excel abrir os acentos certo.
  const csv = "﻿" + lines.join("\r\n");
  const hoje = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ayumana-contatos-${hoje}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Coleta de eventos do analytics próprio. Público (sem auth), grava via service
// role. Nunca falha de um jeito que atrapalhe a navegação.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const type = body?.type;
    // 'campaign' marca acesso vindo da campanha de reativação (email/whatsapp).
    if (type !== "pageview" && type !== "click" && type !== "campaign") {
      return new NextResponse(null, { status: 204 });
    }
    const admin = createAdminClient();
    await admin.from("analytics_events").insert({
      type,
      path: (String(body.path ?? "").slice(0, 300)) || null,
      label: body.label ? String(body.label).slice(0, 200) : null,
      referrer: body.referrer ? String(body.referrer).slice(0, 200) : null,
      device: body.device === "mobile" ? "mobile" : body.device === "desktop" ? "desktop" : null,
      visitor: body.visitor ? String(body.visitor).slice(0, 60) : null,
      // Atribuição de comunidade (slug), para medir o funil de cada parceiro.
      community: body.community ? String(body.community).slice(0, 80) : null,
      utm_source: body.utm_source ? String(body.utm_source).slice(0, 60) : null,
      utm_medium: body.utm_medium ? String(body.utm_medium).slice(0, 60) : null,
      utm_campaign: body.utm_campaign ? String(body.utm_campaign).slice(0, 60) : null,
    });
  } catch {
    // silêncio: analytics nunca pode quebrar o site
  }
  return new NextResponse(null, { status: 204 });
}

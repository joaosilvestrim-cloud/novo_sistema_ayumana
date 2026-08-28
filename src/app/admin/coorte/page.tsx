import Link from "next/link";
import { Rocket, Check, X, Globe2, Video, Eye, MessageCircle, MessagesSquare } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Coorte relançamento" };

// Relançamento da campanha de reativação.
const RELANCAMENTO = "2026-08-21T00:00:00-03:00";

type Row = {
  id: string;
  display_name: string | null;
  slug: string | null;
  profile_completed: boolean;
  attends_abroad: boolean;
  video_url: string | null;
  trial_ends_at: string | null;
  profile_updated_at: string | null;
};

function Card({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground-muted">{titulo}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground-muted">{sub}</p>}
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Linha({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-foreground-muted">{label}</span>
      <span className="text-lg font-semibold text-heading">{value}</span>
    </div>
  );
}

const Sim = () => <Check className="mx-auto h-4 w-4 text-green-600" />;
const Nao = () => <X className="mx-auto h-4 w-4 text-neutral-300" />;

export default async function CoortePage() {
  await requireAdmin();
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const c = async (b: PromiseLike<{ count: number | null }>) => (await b).count ?? 0;

  // Contagens da BASE TOTAL.
  const [cadastrados, verificados, completos, publicados, emTeste, pagantes] = await Promise.all([
    c(admin.from("psychologists").select("*", { count: "exact", head: true })),
    c(admin.from("psychologists").select("*", { count: "exact", head: true }).eq("verification_status", "aprovado")),
    c(admin.from("psychologists").select("*", { count: "exact", head: true }).eq("profile_completed", true)),
    c(admin.from("psychologists").select("*", { count: "exact", head: true }).eq("is_published", true)),
    c(admin.from("psychologists").select("*", { count: "exact", head: true }).eq("trial_tier", "ideal").gt("trial_ends_at", nowIso)),
    c(admin.from("psychologists").select("*", { count: "exact", head: true }).eq("subscription_status", "ativa").neq("plan_tier", "essencial")),
  ]);

  // COORTE: quem está com o teste do Voz ativo (o grupo da reativação).
  const { data: coorteRaw } = await admin
    .from("psychologists")
    .select("id, display_name, slug, profile_completed, attends_abroad, video_url, trial_ends_at, profile_updated_at")
    .eq("trial_tier", "ideal")
    .gt("trial_ends_at", nowIso)
    .order("trial_ends_at", { ascending: true });
  const coorte = (coorteRaw as Row[] | null) ?? [];

  // Atividade desde o relançamento (mexeram no próprio perfil).
  const ativosDesdeRelancamento = await c(
    admin.from("psychologists").select("*", { count: "exact", head: true }).gte("profile_updated_at", RELANCAMENTO)
  );

  // Analytics por perfil (views e contatos WhatsApp), agregado por path.
  const { data: ev } = await admin
    .from("analytics_events")
    .select("type, path, label")
    .ilike("path", "/psicologo/%")
    .gte("created_at", since30)
    .limit(10000);
  const views: Record<string, number> = {};
  const whats: Record<string, number> = {};
  for (const e of (ev as { type: string; path: string | null; label: string | null }[] | null) ?? []) {
    const p = e.path ?? "";
    if (e.type === "pageview") views[p] = (views[p] ?? 0) + 1;
    else if (e.type === "click" && (e.label ?? "").includes("wa.me")) whats[p] = (whats[p] ?? 0) + 1;
  }

  // Respostas no fórum por psicólogo.
  const { data: fa } = await admin.from("forum_answers").select("psychologist_id").limit(20000);
  const respostas: Record<string, number> = {};
  for (const r of (fa as { psychologist_id: string }[] | null) ?? []) {
    respostas[r.psychologist_id] = (respostas[r.psychologist_id] ?? 0) + 1;
  }

  // Métricas da coorte.
  const coorteCompletos = coorte.filter((r) => r.profile_completed).length;
  const coorteExterior = coorte.filter((r) => r.attends_abroad).length;
  const coorteVideo = coorte.filter((r) => !!r.video_url).length;
  const fmtDia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—");
  const vistosDe = (slug: string | null) => (slug ? views[`/psicologo/${slug}`] ?? 0 : 0);
  const whatsDe = (slug: string | null) => (slug ? whats[`/psicologo/${slug}`] ?? 0 : 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl"><Rocket className="h-6 w-6 text-brand-dark" /> Coorte de relançamento</h1>
        <p className="mt-1 text-foreground-muted">
          Separa o grupo da reativação (quem está no teste do Voz) da base total. Relançamento em 21/08/2026.
        </p>
      </div>

      {/* Base total x Coorte */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card titulo="Base total" sub="Inclui herdados da plataforma antiga.">
          <Linha label="Cadastrados" value={cadastrados} />
          <Linha label="Verificados" value={verificados} />
          <Linha label="Perfil completo" value={completos} />
          <Linha label="Publicados" value={publicados} />
          <Linha label="Em teste do Voz" value={emTeste} />
          <Linha label="Pagantes" value={pagantes} />
        </Card>
        <Card titulo="Coorte relançamento" sub="Quem está com o teste do Voz ativo agora.">
          <Linha label="No teste do Voz" value={coorte.length} />
          <Linha label="Com perfil completo" value={`${coorteCompletos} / ${coorte.length}`} />
          <Linha label="Atende no exterior" value={`${coorteExterior} / ${coorte.length}`} />
          <Linha label="Com vídeo de apresentação" value={`${coorteVideo} / ${coorte.length}`} />
          <Linha label="Mexeram no perfil desde 21/08" value={ativosDesdeRelancamento} />
        </Card>
      </div>

      {/* Tabela por pessoa */}
      <section className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg">Cada pessoa da coorte</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">
            O que cada uma fez. Views e contatos são dos últimos 30 dias. É a base para D90: quem converter e o que fez diferente.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
                <th className="px-4 py-3 font-medium">Psicólogo(a)</th>
                <th className="px-3 py-3 text-center font-medium">Completo</th>
                <th className="px-3 py-3 text-center font-medium">Exterior</th>
                <th className="px-3 py-3 text-center font-medium">Vídeo</th>
                <th className="px-3 py-3 text-center font-medium"><Eye className="mx-auto h-4 w-4" /></th>
                <th className="px-3 py-3 text-center font-medium"><MessageCircle className="mx-auto h-4 w-4" /></th>
                <th className="px-3 py-3 text-center font-medium"><MessagesSquare className="mx-auto h-4 w-4" /></th>
                <th className="px-3 py-3 text-center font-medium">Teste até</th>
              </tr>
            </thead>
            <tbody>
              {coorte.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/usuarios/${r.id}`} className="font-medium text-heading hover:text-brand-dark hover:underline">
                      {r.display_name || "—"}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center">{r.profile_completed ? <Sim /> : <Nao />}</td>
                  <td className="px-3 py-3 text-center">{r.attends_abroad ? <Sim /> : <Nao />}</td>
                  <td className="px-3 py-3 text-center">{r.video_url ? <Sim /> : <Nao />}</td>
                  <td className="px-3 py-3 text-center text-foreground">{vistosDe(r.slug)}</td>
                  <td className="px-3 py-3 text-center font-medium text-brand-dark">{whatsDe(r.slug)}</td>
                  <td className="px-3 py-3 text-center text-foreground">{respostas[r.id] ?? 0}</td>
                  <td className="px-3 py-3 text-center text-xs text-foreground-muted">{fmtDia(r.trial_ends_at)}</td>
                </tr>
              ))}
              {coorte.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-foreground-muted">Ninguém em teste do Voz agora.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border px-6 py-3 text-xs text-foreground-muted">
          <Globe2 className="mr-1 inline h-3.5 w-3.5" /> Exterior · <Video className="mx-1 inline h-3.5 w-3.5" /> vídeo ·{" "}
          <Eye className="mx-1 inline h-3.5 w-3.5" /> perfis vistos · <MessageCircle className="mx-1 inline h-3.5 w-3.5" /> contatos no WhatsApp ·{" "}
          <MessagesSquare className="mx-1 inline h-3.5 w-3.5" /> respostas no fórum.
        </div>
      </section>
    </div>
  );
}

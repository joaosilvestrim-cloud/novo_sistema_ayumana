import Link from "next/link";
import {
  Eye, Users, MousePointerClick, TrendingUp, Smartphone, Globe, MessageCircle, Globe2,
  ShieldCheck, CheckCircle2, Rocket, DollarSign, MessagesSquare, UserPlus,
  ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CampaignLinks } from "@/components/admin/campaign-links";

export const metadata = { title: "Analytics" };

type Top = { rotulo: string; n: number };
type Dia = { dia: string; pageviews: number; clicks: number };

/** Selo de variação: últimos 7 dias vs os 7 anteriores. Sobe verde, cai vermelho. */
function Delta({ atual, anterior }: { atual: number; anterior: number }) {
  if (atual === 0 && anterior === 0) return null;
  const pct = anterior === 0 ? 100 : Math.round(((atual - anterior) / anterior) * 100);
  const igual = pct === 0;
  const up = pct > 0;
  const forte = Math.abs(pct) >= 30;
  const cor = igual ? "bg-surface-muted text-foreground-muted" : up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  const Icon = igual ? Minus : up ? ArrowUpRight : ArrowDownRight;
  // Limita a exibição para não mostrar números absurdos (ex.: +3900%).
  const clamp = Math.max(-999, Math.min(999, pct));
  const texto = `${up ? "+" : ""}${clamp}%${Math.abs(pct) > 999 ? "+" : ""}`;
  return (
    <span
      title={`Últimos 7 dias vs. os 7 anteriores (${up ? "+" : ""}${pct}%)`}
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${cor} ${forte ? "animate-pulse" : ""}`}
    >
      <Icon className="h-3 w-3" />
      {texto}
    </span>
  );
}

function Stat({ icon, label, value, sub, trend }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; trend?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">{icon}</div>
        {trend}
      </div>
      <p className="mt-3 text-2xl font-semibold text-heading">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
}

function ListaTop({ titulo, subtitulo, rows, cor, formata }: {
  titulo: string; subtitulo?: string; rows: Top[]; cor: string; formata?: (s: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <h2 className="text-lg">{titulo}</h2>
      {subtitulo && <p className="mt-0.5 text-sm text-foreground-muted">{subtitulo}</p>}
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-muted">Sem dados ainda.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div key={r.rotulo} className="flex items-center gap-3">
              <div className="w-40 shrink-0 truncate text-sm text-foreground sm:w-56" title={r.rotulo}>{formata ? formata(r.rotulo) : r.rotulo}</div>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="ayu-bar-w h-full rounded-full" style={{ width: `${Math.max(4, Math.round((r.n / max) * 100))}%`, background: cor }} />
              </div>
              <div className="w-12 shrink-0 text-right text-sm font-semibold text-heading">{r.n}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Barras de proporção sobre um total (ex.: % dos publicados com foto). */
function Barras({ titulo, subtitulo, rows, total, cor }: {
  titulo: string; subtitulo?: string; rows: { label: string; n: number }[]; total: number; cor: string;
}) {
  const t = Math.max(1, total);
  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <h2 className="text-lg">{titulo}</h2>
      {subtitulo && <p className="mt-0.5 text-sm text-foreground-muted">{subtitulo}</p>}
      <div className="mt-4 space-y-2.5">
        {rows.map((r) => {
          const pct = Math.round((r.n / t) * 100);
          return (
            <div key={r.label} className="flex items-center gap-3">
              <div className="w-44 shrink-0 truncate text-sm text-foreground" title={r.label}>{r.label}</div>
              <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="ayu-bar-w h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: cor }} />
              </div>
              <div className="w-24 shrink-0 text-right text-sm text-foreground-muted">
                <span className="font-semibold text-heading">{r.n}</span> · {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Nomes amigáveis para as rotas mais comuns, para a lista não mostrar caminho cru.
const NOMES_ROTA: Record<string, string> = {
  "/": "Página inicial",
  "/psicologos": "Busca de psicólogos",
  "/encontrar": "Quiz (encontrar psicólogo)",
  "/para-psicologos": "Para psicólogos (planos)",
  "/perguntas": "Fórum",
  "/login": "Login",
  "/cadastro": "Cadastro",
  "/esqueci-senha": "Acesso pela campanha",
  "/redefinir-senha": "Redefinir senha",
  "/painel": "Painel do psicólogo",
  "/painel/onboarding": "Meu perfil (onboarding)",
  "/painel/assinatura": "Assinatura",
  "/painel/forum": "Fórum (painel)",
  "/painel/ajuda": "Ajuda e planos",
};
function nomeRota(p: string): string {
  if (NOMES_ROTA[p]) return NOMES_ROTA[p];
  if (p.startsWith("/psicologo/")) return `Perfil: ${p.slice("/psicologo/".length)}`;
  if (p.startsWith("/perguntas/")) return `Fórum: ${p.slice("/perguntas/".length)}`;
  return p;
}
const CANAL_NOME: Record<string, string> = {
  whatsapp: "WhatsApp", email: "E-mail", direto: "Direto (sem marcação)", campanha: "Campanha (genérico)",
};
const canalNome = (s: string) => CANAL_NOME[s] ?? s;

function rotuloClique(s: string): string {
  if (/wa\.me|whatsapp/i.test(s)) return "Contato no WhatsApp";
  if (s.startsWith("/")) return `link → ${nomeRota(s)}`;
  if (/^https?:\/\//i.test(s)) { try { return new URL(s).hostname; } catch { return s; } }
  return s;
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const now = Date.now();
  const d = (dias: number) => new Date(now - dias * 86_400_000).toISOString();
  const since30 = d(30), since7 = d(7), since14 = d(14);

  const [pv30, pv7, cl30, vis30, topPaths, topClicks, dailyR, devicesR, refsR, perfView30, waClick30, pubTotal, extTotal] = await Promise.all([
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview").gte("created_at", since30),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview").gte("created_at", since7),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "click").gte("created_at", since30),
    admin.rpc("analytics_visitors", { _since: since30 }),
    admin.rpc("analytics_top", { _type: "pageview", _field: "path", _since: since30, _limit: 10 }),
    admin.rpc("analytics_top", { _type: "click", _field: "label", _since: since30, _limit: 12 }),
    admin.rpc("analytics_daily", { _since: since14 }),
    admin.rpc("analytics_top", { _type: "pageview", _field: "device", _since: since30, _limit: 5 }),
    admin.rpc("analytics_top_visitors", { _type: "pageview", _field: "referrer", _since: since30, _limit: 8 }),
    // Valor gerado: perfis vistos e contatos no WhatsApp a partir do perfil.
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview").ilike("path", "/psicologo/%").gte("created_at", since30),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "click").ilike("path", "/psicologo/%").ilike("label", "%wa.me%").gte("created_at", since30),
    // Base publicada e quantos atendem no exterior.
    admin.from("psychologists").select("*", { count: "exact", head: true }).eq("is_published", true),
    admin.from("psychologists").select("*", { count: "exact", head: true }).eq("is_published", true).eq("attends_abroad", true),
  ]);

  const pageviews30 = pv30.count ?? 0;
  const pageviews7 = pv7.count ?? 0;
  const clicks30 = cl30.count ?? 0;
  const visitantes = (vis30.data as number) ?? 0;
  const paths = (topPaths.data as Top[]) ?? [];
  const clicks = (topClicks.data as Top[]) ?? [];
  const daily = (dailyR.data as Dia[]) ?? [];
  const devices = (devicesR.data as Top[]) ?? [];
  const referrers = (refsR.data as Top[]) ?? [];

  // Perfil visto -> contato no WhatsApp (o KPI de valor). E atende no exterior.
  const perfisVistos = perfView30.count ?? 0;
  const contatosWhats = waClick30.count ?? 0;
  const conversao = perfisVistos > 0 ? Math.round((contatosWhats / perfisVistos) * 100) : 0;
  const publicados = pubTotal.count ?? 0;
  const exterior = extTotal.count ?? 0;
  const pctExterior = publicados > 0 ? Math.round((exterior / publicados) * 100) : 0;

  // Momentum: últimos 7 dias vs. os 7 anteriores (alta/queda).
  const AE = () => admin.from("analytics_events").select("*", { count: "exact", head: true });
  const [pvPrev7, clLast7, clPrev7, perfLast7, perfPrev7, whatsLast7, whatsPrev7] = await Promise.all([
    AE().eq("type", "pageview").gte("created_at", since14).lt("created_at", since7),
    AE().eq("type", "click").gte("created_at", since7),
    AE().eq("type", "click").gte("created_at", since14).lt("created_at", since7),
    AE().eq("type", "pageview").ilike("path", "/psicologo/%").gte("created_at", since7),
    AE().eq("type", "pageview").ilike("path", "/psicologo/%").gte("created_at", since14).lt("created_at", since7),
    AE().eq("type", "click").ilike("path", "/psicologo/%").ilike("label", "%wa.me%").gte("created_at", since7),
    AE().eq("type", "click").ilike("path", "/psicologo/%").ilike("label", "%wa.me%").gte("created_at", since14).lt("created_at", since7),
  ]);
  const pageviewsPrev7 = pvPrev7.count ?? 0;
  const clicksLast7 = clLast7.count ?? 0;
  const clicksPrev7 = clPrev7.count ?? 0;
  const perfLast7N = perfLast7.count ?? 0;
  const perfPrev7N = perfPrev7.count ?? 0;
  const whatsLast7N = whatsLast7.count ?? 0;
  const whatsPrev7N = whatsPrev7.count ?? 0;

  // ---- Análise da base e dos perfis ----
  const nowIso = new Date().toISOString();
  const cont = async (b: PromiseLike<{ count: number | null }>) => (await b).count ?? 0;
  const P = () => admin.from("psychologists").select("*", { count: "exact", head: true });
  const Ppub = () => P().eq("is_published", true);

  const [
    baseTotal, verificadosN, completosN, emTesteN, pagantesN,
    qFoto, qBio, qVideo, qValor, qAceita,
    planEss, planDest, planIdeal, planPres,
    perguntasN,
  ] = await Promise.all([
    cont(P()),
    cont(P().eq("verification_status", "aprovado")),
    cont(P().eq("profile_completed", true)),
    cont(P().eq("trial_tier", "ideal").gt("trial_ends_at", nowIso)),
    cont(P().eq("subscription_status", "ativa").neq("plan_tier", "essencial")),
    cont(Ppub().not("avatar_url", "is", null)),
    cont(Ppub().not("bio", "is", null)),
    cont(Ppub().not("video_url", "is", null)),
    cont(Ppub().gt("session_price_cents", 0)),
    cont(Ppub().eq("accepting_patients", true)),
    cont(P().eq("plan_tier", "essencial")),
    cont(P().eq("plan_tier", "destaque")),
    cont(P().eq("plan_tier", "ideal")),
    cont(P().eq("plan_tier", "presenca")),
    cont(admin.from("forum_questions").select("*", { count: "exact", head: true })),
  ]);

  // Fórum: perguntas respondidas (distintas) e total de respostas.
  const { data: ansRows } = await admin.from("forum_answers").select("question_id").limit(20000);
  const respostasTotais = (ansRows as { question_id: string }[] | null)?.length ?? 0;
  const perguntasRespondidas = new Set((ansRows as { question_id: string }[] | null ?? []).map((r) => r.question_id)).size;

  // Top perfis: mais vistos e mais contatados (agrega eventos por /psicologo/slug).
  const { data: evP } = await admin.from("analytics_events").select("type, path, label").ilike("path", "/psicologo/%").gte("created_at", since30).limit(10000);
  const vmap: Record<string, number> = {}, wmap: Record<string, number> = {};
  for (const e of (evP as { type: string; path: string | null; label: string | null }[] | null) ?? []) {
    const slug = (e.path ?? "").slice("/psicologo/".length);
    if (!slug) continue;
    if (e.type === "pageview") vmap[slug] = (vmap[slug] ?? 0) + 1;
    else if (e.type === "click" && (e.label ?? "").includes("wa.me")) wmap[slug] = (wmap[slug] ?? 0) + 1;
  }
  const slugsEnvolvidos = [...new Set([...Object.keys(vmap), ...Object.keys(wmap)])].slice(0, 300);
  const { data: nomesRows } = slugsEnvolvidos.length
    ? await admin.from("psychologists").select("slug, display_name").in("slug", slugsEnvolvidos)
    : { data: [] as { slug: string; display_name: string | null }[] };
  const nomePorSlug: Record<string, string> = {};
  for (const r of (nomesRows as { slug: string; display_name: string | null }[] | null) ?? []) nomePorSlug[r.slug] = r.display_name ?? r.slug;
  const nomeSlug = (s: string) => nomePorSlug[s] ?? s;
  const topVistos = Object.entries(vmap).map(([s, n]) => ({ rotulo: nomeSlug(s), n })).sort((a, b) => b.n - a.n).slice(0, 8);
  const topContatos = Object.entries(wmap).map(([s, n]) => ({ rotulo: nomeSlug(s), n })).sort((a, b) => b.n - a.n).slice(0, 8);

  // Perfis atualizados por semana (a onda de reativação). Usamos profile_updated_at
  // em vez de created_at porque a base foi importada de uma vez; "atualizou" é o
  // sinal de atividade real.
  const { data: atualizados } = await admin.from("psychologists").select("profile_updated_at").gte("profile_updated_at", d(56));
  const semanas: { label: string; n: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const fim = now - w * 7 * 86_400_000;
    const ini = fim - 7 * 86_400_000;
    const n = ((atualizados as { profile_updated_at: string | null }[] | null) ?? []).filter((c) => {
      if (!c.profile_updated_at) return false;
      const t = new Date(c.profile_updated_at).getTime();
      return t >= ini && t < fim;
    }).length;
    const dt = new Date(ini);
    semanas.push({ label: `${String(dt.getUTCDate()).padStart(2, "0")}/${String(dt.getUTCMonth() + 1).padStart(2, "0")}`, n });
  }
  const maxSemana = Math.max(1, ...semanas.map((s) => s.n));

  // Campanha por canal (email/whatsapp/direto/...).
  const campanhaR = await admin.rpc("analytics_top", { _type: "campaign", _field: "label", _since: since30, _limit: 8 });
  const campanha = (campanhaR.data as Top[]) ?? [];

  // Série de 14 dias contínua (preenche dias sem dado).
  const porDia = new Map(daily.map((x) => [x.dia, x]));
  const serie: Dia[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(now - i * 86_400_000);
    const key = dt.toISOString().slice(0, 10);
    const achou = porDia.get(key);
    serie.push({ dia: key, pageviews: achou?.pageviews ?? 0, clicks: achou?.clicks ?? 0 });
  }
  const maxDia = Math.max(1, ...serie.map((s) => Math.max(s.pageviews, s.clicks)));

  const totalDisp = Math.max(1, devices.reduce((a, b) => a + b.n, 0));

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes ayuGrowW { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        @keyframes ayuGrowH { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes ayuRise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        .ayu-bar-w { transform-origin: left center; animation: ayuGrowW .7s cubic-bezier(.2,.7,.3,1) both; }
        .ayu-bar-h { transform-origin: center bottom; animation: ayuGrowH .6s cubic-bezier(.2,.7,.3,1) both; }
        .ayu-rise { animation: ayuRise .5s ease-out both; }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl"><TrendingUp className="h-6 w-6 text-brand-dark" /> Analytics do site</h1>
          <p className="mt-1 text-foreground-muted">Dados reais, coletados pelo próprio site. Janela padrão de 30 dias. Sem cookies de terceiros, sem IP e sem dado pessoal.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground-muted">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
          Dados ao vivo
        </span>
      </div>

      {/* Valor gerado: o KPI que mais importa, primeiro */}
      <section className="rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <h2 className="flex items-center gap-2 text-lg"><MessageCircle className="h-5 w-5 text-brand-dark" /> Valor gerado</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          O elo que gera negócio: paciente vê o perfil e chama o psicólogo. Números dos últimos 30 dias. As setas comparam os últimos 7 dias com os 7 anteriores.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat icon={<Eye className="h-5 w-5" />} label="Perfis vistos (30d)" value={perfisVistos}
            sub="Vezes que um perfil de psicólogo foi aberto. Mais aberturas = mais gente conhecendo os profissionais." trend={<Delta atual={perfLast7N} anterior={perfPrev7N} />} />
          <Stat icon={<MessageCircle className="h-5 w-5" />} label="Contatos no WhatsApp (30d)" value={contatosWhats}
            sub={`Cliques no botão de falar no WhatsApp dentro de um perfil. ${conversao}% de quem viu um perfil chamou o profissional.`} trend={<Delta atual={whatsLast7N} anterior={whatsPrev7N} />} />
          <Stat icon={<Globe2 className="h-5 w-5" />} label="Atende no exterior" value={`${exterior} / ${publicados}`}
            sub={`Perfis publicados que atendem brasileiros fora do Brasil (${pctExterior}%). É o público com menos concorrência.`} />
        </div>
      </section>

      {/* Tráfego geral */}
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Tráfego do site</h2>
        <p className="mb-3 text-xs text-foreground-muted">Volume de acesso ao site inteiro. As setas comparam os últimos 7 dias com os 7 anteriores.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Eye className="h-5 w-5" />} label="Visualizações (30d)" value={pageviews30}
            sub={`Páginas abertas no site, cada abertura conta 1. ${pageviews7} foram nos últimos 7 dias.`} trend={<Delta atual={pageviews7} anterior={pageviewsPrev7} />} />
          <Stat icon={<Users className="h-5 w-5" />} label="Visitantes únicos (30d)" value={visitantes}
            sub="Navegadores diferentes que acessaram. Aproxima o nº de pessoas: o mesmo aparelho conta uma vez." />
          <Stat icon={<MousePointerClick className="h-5 w-5" />} label="Cliques (30d)" value={clicks30}
            sub="Toques em links e botões. Mede o quanto as pessoas agem, não só olham." trend={<Delta atual={clicksLast7} anterior={clicksPrev7} />} />
          <Stat icon={<Smartphone className="h-5 w-5" />} label="Acessos no celular"
            value={`${Math.round(((devices.find((x) => x.rotulo === "mobile")?.n ?? 0) / totalDisp) * 100)}%`}
            sub="Fatia das visualizações feitas no celular (o resto é computador)." />
        </div>
      </div>

      {/* Saúde da base */}
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-foreground-muted">Saúde da base</h2>
        <p className="mb-3 text-xs text-foreground-muted">O funil da base de psicólogos, do cadastro até o pagamento.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Stat icon={<Users className="h-5 w-5" />} label="Cadastrados" value={baseTotal} sub="Total de psicólogos na base (inclui herdados da plataforma antiga)." />
          <Stat icon={<ShieldCheck className="h-5 w-5" />} label="Verificados" value={verificadosN} sub={`CRP conferido pela equipe. ${baseTotal ? Math.round((verificadosN / baseTotal) * 100) : 0}% da base.`} />
          <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Perfil completo" value={completosN} sub={`Preencheram tudo o que é obrigatório. ${baseTotal ? Math.round((completosN / baseTotal) * 100) : 0}% da base.`} />
          <Stat icon={<Eye className="h-5 w-5" />} label="Publicados" value={publicados} sub={`Aparecem na vitrine. ${baseTotal ? Math.round((publicados / baseTotal) * 100) : 0}% da base.`} />
          <Stat icon={<Rocket className="h-5 w-5" />} label="Em teste do Voz" value={emTesteN} sub="Usando o plano Voz de cortesia, sem pagar ainda." />
          <Stat icon={<DollarSign className="h-5 w-5" />} label="Pagantes" value={pagantesN} sub="Com assinatura paga ativa." />
        </div>
      </div>

      {/* Qualidade dos perfis + Planos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Barras
          titulo="Qualidade dos perfis publicados"
          subtitulo={`O que os ${publicados} perfis publicados já preencheram.`}
          total={publicados}
          cor="#05474A"
          rows={[
            { label: "Com foto", n: qFoto },
            { label: "Com apresentação", n: qBio },
            { label: "Com valor da sessão", n: qValor },
            { label: "Com vídeo", n: qVideo },
            { label: "Atende no exterior", n: exterior },
            { label: "Aceitando pacientes", n: qAceita },
          ]}
        />
        <Barras
          titulo="Planos contratados"
          subtitulo={`Distribuição da base por plano. Além destes, ${emTesteN} estão em teste do Voz.`}
          total={baseTotal}
          cor="#53C4CC"
          rows={[
            { label: "Raiz (grátis)", n: planEss },
            { label: "Alcance", n: planDest },
            { label: "Voz", n: planIdeal },
            { label: "Presença", n: planPres },
          ]}
        />
      </div>

      {/* Fórum + Top perfis contatados */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg"><MessagesSquare className="h-5 w-5 text-brand-dark" /> Fórum</h2>
              <p className="mt-0.5 text-sm text-foreground-muted">A tese do Voz: perguntas respondidas viram páginas indexadas no Google.</p>
            </div>
            <Link href="/admin/moderacao" className="shrink-0 text-sm font-medium text-brand-dark hover:underline">Abrir fórum →</Link>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div><p className="text-2xl font-semibold text-heading">{perguntasN}</p><p className="text-xs text-foreground-muted">perguntas</p></div>
            <div><p className="text-2xl font-semibold text-green-700">{perguntasRespondidas}</p><p className="text-xs text-foreground-muted">respondidas ({perguntasN ? Math.round((perguntasRespondidas / perguntasN) * 100) : 0}%)</p></div>
            <div><p className="text-2xl font-semibold text-heading">{respostasTotais}</p><p className="text-xs text-foreground-muted">respostas no total</p></div>
          </div>
          {/* Barra segmentada: respondidas vs sem resposta */}
          <div className="mt-5 flex h-7 overflow-hidden rounded-full bg-surface-muted text-[11px] font-bold">
            {perguntasRespondidas > 0 && (
              <div className="ayu-bar-w flex items-center justify-center bg-[#2FA36B] text-white" style={{ width: `${Math.round((perguntasRespondidas / Math.max(1, perguntasN)) * 100)}%`, minWidth: 26 }}>{perguntasRespondidas}</div>
            )}
            {perguntasN - perguntasRespondidas > 0 && (
              <div className="flex items-center justify-center bg-neutral-300 text-neutral-700" style={{ width: `${Math.round(((perguntasN - perguntasRespondidas) / Math.max(1, perguntasN)) * 100)}%` }}>{perguntasN - perguntasRespondidas}</div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2FA36B]" /> respondidas</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-neutral-300" /> sem resposta</span>
          </div>
          {perguntasN - perguntasRespondidas > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span><strong>{perguntasN - perguntasRespondidas}</strong> perguntas ainda sem nenhuma resposta. Peça a um psicólogo do Voz para responder e virar página no Google.</span>
            </div>
          )}
        </section>
        <ListaTop titulo="Perfis mais contatados" subtitulo="Quem mais recebeu clique no WhatsApp (30d)." rows={topContatos} cor="#25D366" />
      </div>

      {/* Top perfis vistos + Novos cadastros */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListaTop titulo="Perfis mais vistos" subtitulo="Quem mais teve o perfil aberto (30d)." rows={topVistos} cor="#F5C84B" />
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="flex items-center gap-2 text-lg"><UserPlus className="h-5 w-5 text-brand-dark" /> Perfis atualizados por semana</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">Atividade da base nas últimas 8 semanas. Mostra a onda de reativação.</p>
          <div className="mt-4 flex h-32 items-end gap-2">
            {semanas.map((s) => (
              <div key={s.label} className="group flex flex-1 flex-col items-center justify-end gap-1" title={`Semana de ${s.label}: ${s.n} atualizações`}>
                <span className="text-[10px] font-medium text-foreground-muted">{s.n}</span>
                <div className="ayu-bar-h w-full rounded-t bg-[#73A533]" style={{ height: `${Math.round((s.n / maxSemana) * 100)}%`, minHeight: s.n > 0 ? 3 : 0 }} />
                <span className="text-[10px] text-foreground-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Gráfico diário */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Movimento por dia</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">Visualizações e cliques nos últimos 14 dias. Passe o mouse em cada dia para ver os números.</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-foreground-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#73A533]" /> Visualizações</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#53C4CC]" /> Cliques</span>
        </div>
        <div className="mt-4 flex h-40 items-stretch gap-1.5">
          {serie.map((s) => (
            <div key={s.dia} className="group flex flex-1 flex-col" title={`${s.dia.slice(8, 10)}/${s.dia.slice(5, 7)}: ${s.pageviews} visualizações, ${s.clicks} cliques`}>
              <div className="flex flex-1 items-end justify-center gap-0.5">
                <div className="ayu-bar-h w-2 rounded-t bg-[#73A533] transition-opacity group-hover:opacity-80" style={{ height: `${Math.round((s.pageviews / maxDia) * 100)}%`, minHeight: s.pageviews > 0 ? 3 : 0 }} />
                <div className="ayu-bar-h w-2 rounded-t bg-[#53C4CC] transition-opacity group-hover:opacity-80" style={{ height: `${Math.round((s.clicks / maxDia) * 100)}%`, minHeight: s.clicks > 0 ? 3 : 0 }} />
              </div>
              <span className="mt-1 text-center text-[10px] text-foreground-muted">{s.dia.slice(8, 10)}/{s.dia.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top páginas + Top cliques */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListaTop titulo="Páginas mais vistas" subtitulo="Nº de visualizações por página, no período." rows={paths} cor="#05474A" formata={nomeRota} />
        <ListaTop titulo="Mais clicados" subtitulo="Nº de cliques por botão ou link no período." rows={clicks} cor="#53C4CC" formata={rotuloClique} />
      </div>

      {/* Dispositivos + Origens */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="flex items-center gap-2 text-lg"><Smartphone className="h-5 w-5 text-brand-dark" /> Dispositivos</h2>
          <div className="mt-4 space-y-2">
            {devices.length === 0 ? <p className="text-sm text-foreground-muted">Sem dados ainda.</p> : devices.map((dv) => (
              <div key={dv.rotulo} className="flex items-center gap-3">
                <div className="w-20 shrink-0 text-sm capitalize text-foreground">{dv.rotulo}</div>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div className="ayu-bar-w h-full rounded-full bg-[#73A533]" style={{ width: `${Math.round((dv.n / totalDisp) * 100)}%` }} />
                </div>
                <div className="w-16 shrink-0 text-right text-sm text-foreground-muted">{Math.round((dv.n / totalDisp) * 100)}%</div>
              </div>
            ))}
          </div>
        </section>

        <ListaTop titulo="De onde vêm" subtitulo="Visitantes diferentes que chegaram de cada site externo." rows={referrers} cor="#F5C84B" />
      </div>

      {/* Campanha por canal */}
      {campanha.length > 0 && (
        <Barras
          titulo="Campanha por canal"
          subtitulo="De onde vieram os acessos da campanha de reativação (quem abriu /esqueci-senha)."
          total={Math.max(1, campanha.reduce((a, b) => a + b.n, 0))}
          cor="#F5C84B"
          rows={campanha.map((r) => ({ label: canalNome(r.rotulo), n: r.n }))}
        />
      )}

      {/* Links da campanha com marcação de origem */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Links da campanha (marque a origem)</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Use estes links ao convidar a base pelo canal certo. Cada um registra de onde a pessoa veio, para sabermos o que converte mais. Sem isso, o acesso cai em &quot;direto&quot;.
        </p>
        <div className="mt-4">
          <CampaignLinks site={process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br"} />
        </div>
      </section>

      {/* Como lemos estes números */}
      <section className="rounded-2xl border border-border bg-surface-muted/40 p-6">
        <h2 className="text-lg">Como lemos estes números</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">Tudo é medido pelo próprio site, no lado do visitante. Nada é estimado ou simulado.</p>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
            ["Valor gerado", "Perfis vistos é quantas vezes uma página de perfil de psicólogo foi aberta. Contatos no WhatsApp é quantas vezes alguém clicou no botão de falar no WhatsApp dentro de um perfil. A conversão é contatos dividido por perfis vistos. É o número que mais importa: mede quando o paciente realmente procura o profissional."],
            ["Qualidade dos perfis", "Entre os perfis publicados, quantos já preencheram cada item (foto, apresentação, valor, vídeo, exterior, agenda aberta). Bom para ver o que falta puxar na base."],
            ["Perfis atualizados por semana", "Quantos perfis foram salvos em cada semana. Usa a data da última edição, não a de cadastro, porque a base foi importada de uma vez. É a curva de reativação."],
            ["Fórum", "Perguntas criadas, quantas já têm ao menos uma resposta, e o total de respostas. É a base da descoberta orgânica prometida no Voz."],
            ["Atende no exterior", "Quantos perfis publicados marcaram que atendem brasileiros no exterior, sobre o total de publicados."],
            ["Visualização (pageview)", "Registrada toda vez que uma página abre ou o visitante troca de rota. Abrir a mesma página em sequência não conta duas vezes."],
            ["Visitante único", "Cada navegador recebe um código anônimo e aleatório guardado nele. Contamos códigos distintos. Limpar o navegador, usar anônimo ou outro aparelho vira um novo visitante. Por isso é 'navegadores', não 'pessoas'."],
            ["Clique", "Registrado quando o visitante clica num link, botão ou item marcado. O rótulo vem do link (a página de destino) ou do texto do botão."],
            ["Mobile / Desktop", "Definido pela largura da tela no momento do acesso: abaixo de 768px é mobile, o resto é desktop."],
            ["Movimento por dia", "As barras verdes são visualizações e as azuis são cliques, dia a dia. As duas usam a mesma escala, então dá para comparar a altura entre elas."],
            ["Páginas mais vistas", "As páginas com maior número de visualizações no período."],
            ["Mais clicados", "Os botões e links com maior número de cliques. 'link → /pagina' quer dizer um link que leva para aquela página."],
            ["De onde vêm", "Conta quantos visitantes diferentes chegaram de cada site externo (o Google, por exemplo). Um mesmo visitante que abriu várias páginas conta uma vez só. Só aparece quando o navegador informa a origem, então parte do tráfego fica sem origem."],
            ["Período", "Os cartões do topo e as listas usam os últimos 30 dias. O gráfico usa os últimos 14 dias."],
          ].map(([termo, texto]) => (
            <div key={termo}>
              <dt className="text-sm font-semibold text-heading">{termo}</dt>
              <dd className="mt-0.5 text-sm text-foreground-muted">{texto}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <Globe className="h-3.5 w-3.5" /> Analytics próprio, sem cookies de rastreio de terceiros, sem IP e sem dado pessoal. As áreas de admin e estúdio não são contadas. Acessos de robôs e buscadores podem inflar um pouco os números.
      </p>
    </div>
  );
}

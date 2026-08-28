import { Eye, Users, MousePointerClick, TrendingUp, Smartphone, Globe, MessageCircle, Globe2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Analytics" };

type Top = { rotulo: string; n: number };
type Dia = { dia: string; pageviews: number; clicks: number };

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">{icon}</div>
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
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.round((r.n / max) * 100))}%`, background: cor }} />
              </div>
              <div className="w-12 shrink-0 text-right text-sm font-semibold text-heading">{r.n}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
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
      <div>
        <h1 className="flex items-center gap-2 text-2xl"><TrendingUp className="h-6 w-6 text-brand-dark" /> Analytics do site</h1>
        <p className="mt-1 text-foreground-muted">Dados reais, coletados pelo próprio site. Janela padrão de 30 dias. Sem cookies de terceiros, sem IP e sem dado pessoal.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Eye className="h-5 w-5" />} label="Visualizações (30d)" value={pageviews30} sub={`Cada página aberta conta 1. ${pageviews7} nos últimos 7 dias.`} />
        <Stat icon={<Users className="h-5 w-5" />} label="Visitantes únicos (30d)" value={visitantes} sub="Navegadores diferentes, não pessoas." />
        <Stat icon={<MousePointerClick className="h-5 w-5" />} label="Cliques (30d)" value={clicks30} sub="Em links e botões do site." />
        <Stat icon={<Smartphone className="h-5 w-5" />} label="Mobile"
          value={`${Math.round(((devices.find((x) => x.rotulo === "mobile")?.n ?? 0) / totalDisp) * 100)}%`}
          sub="Das visualizações, por largura de tela." />
      </div>

      {/* Valor gerado: o KPI que mais importa */}
      <section className="rounded-2xl border border-brand/30 bg-brand/5 p-6">
        <h2 className="flex items-center gap-2 text-lg"><MessageCircle className="h-5 w-5 text-brand-dark" /> Valor gerado</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          O que mais importa: quantas pessoas viram um perfil e quantas clicaram para falar no WhatsApp. Últimos 30 dias.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat icon={<Eye className="h-5 w-5" />} label="Perfis vistos (30d)" value={perfisVistos} sub="Aberturas de página de perfil." />
          <Stat icon={<MessageCircle className="h-5 w-5" />} label="Contatos no WhatsApp (30d)" value={contatosWhats} sub={`${conversao}% de quem viu um perfil clicou para falar.`} />
          <Stat icon={<Globe2 className="h-5 w-5" />} label="Atende no exterior" value={`${exterior} / ${publicados}`} sub={`${pctExterior}% dos perfis publicados.`} />
        </div>
      </section>

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
                <div className="w-2 rounded-t bg-[#73A533] transition-opacity group-hover:opacity-80" style={{ height: `${Math.round((s.pageviews / maxDia) * 100)}%`, minHeight: s.pageviews > 0 ? 3 : 0 }} />
                <div className="w-2 rounded-t bg-[#53C4CC] transition-opacity group-hover:opacity-80" style={{ height: `${Math.round((s.clicks / maxDia) * 100)}%`, minHeight: s.clicks > 0 ? 3 : 0 }} />
              </div>
              <span className="mt-1 text-center text-[10px] text-foreground-muted">{s.dia.slice(8, 10)}/{s.dia.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top páginas + Top cliques */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListaTop titulo="Páginas mais vistas" subtitulo="Nº de visualizações por página, no período." rows={paths} cor="#05474A" />
        <ListaTop titulo="Mais clicados" subtitulo="Nº de cliques por botão ou link. 'link → /x' é um link para a página /x." rows={clicks} cor="#53C4CC"
          formata={(s) => (s.startsWith("/") ? `link → ${s}` : s)} />
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
                  <div className="h-full rounded-full bg-[#73A533]" style={{ width: `${Math.round((dv.n / totalDisp) * 100)}%` }} />
                </div>
                <div className="w-16 shrink-0 text-right text-sm text-foreground-muted">{Math.round((dv.n / totalDisp) * 100)}%</div>
              </div>
            ))}
          </div>
        </section>

        <ListaTop titulo="De onde vêm" subtitulo="Visitantes diferentes que chegaram de cada site externo." rows={referrers} cor="#F5C84B" />
      </div>

      {/* Como lemos estes números */}
      <section className="rounded-2xl border border-border bg-surface-muted/40 p-6">
        <h2 className="text-lg">Como lemos estes números</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">Tudo é medido pelo próprio site, no lado do visitante. Nada é estimado ou simulado.</p>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
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

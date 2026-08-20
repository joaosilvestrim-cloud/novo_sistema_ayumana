import { Eye, Users, MousePointerClick, TrendingUp, Smartphone, Globe } from "lucide-react";
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

  const [pv30, pv7, cl30, vis30, topPaths, topClicks, dailyR, devicesR, refsR] = await Promise.all([
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview").gte("created_at", since30),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview").gte("created_at", since7),
    admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "click").gte("created_at", since30),
    admin.rpc("analytics_visitors", { _since: since30 }),
    admin.rpc("analytics_top", { _type: "pageview", _field: "path", _since: since30, _limit: 10 }),
    admin.rpc("analytics_top", { _type: "click", _field: "label", _since: since30, _limit: 12 }),
    admin.rpc("analytics_daily", { _since: since14 }),
    admin.rpc("analytics_top", { _type: "pageview", _field: "device", _since: since30, _limit: 5 }),
    admin.rpc("analytics_top", { _type: "pageview", _field: "referrer", _since: since30, _limit: 8 }),
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

  // Série de 14 dias contínua (preenche dias sem dado).
  const porDia = new Map(daily.map((x) => [x.dia, x]));
  const serie: Dia[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(now - i * 86_400_000);
    const key = dt.toISOString().slice(0, 10);
    const achou = porDia.get(key);
    serie.push({ dia: key, pageviews: achou?.pageviews ?? 0, clicks: achou?.clicks ?? 0 });
  }
  const maxDia = Math.max(1, ...serie.map((s) => s.pageviews));

  const totalDisp = Math.max(1, devices.reduce((a, b) => a + b.n, 0));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl"><TrendingUp className="h-6 w-6 text-brand-dark" /> Analytics do site</h1>
        <p className="mt-1 text-foreground-muted">Acessos, páginas mais vistas e o que mais clicam. Últimos 30 dias, sem rastrear dado pessoal.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Eye className="h-5 w-5" />} label="Visualizações (30d)" value={pageviews30} sub={`${pageviews7} nos últimos 7 dias`} />
        <Stat icon={<Users className="h-5 w-5" />} label="Visitantes únicos (30d)" value={visitantes} />
        <Stat icon={<MousePointerClick className="h-5 w-5" />} label="Cliques (30d)" value={clicks30} />
        <Stat icon={<Smartphone className="h-5 w-5" />} label="Mobile"
          value={`${Math.round(((devices.find((x) => x.rotulo === "mobile")?.n ?? 0) / totalDisp) * 100)}%`}
          sub="das visualizações" />
      </div>

      {/* Gráfico diário */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Visualizações por dia</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">Últimos 14 dias.</p>
        <div className="mt-5 flex h-40 items-end gap-1.5">
          {serie.map((s) => (
            <div key={s.dia} className="group flex flex-1 flex-col items-center justify-end gap-1" title={`${s.dia}: ${s.pageviews} visualizações, ${s.clicks} cliques`}>
              <span className="text-[10px] text-foreground-muted opacity-0 group-hover:opacity-100">{s.pageviews}</span>
              <div className="w-full rounded-t bg-[#73A533]" style={{ height: `${Math.round((s.pageviews / maxDia) * 100)}%`, minHeight: s.pageviews > 0 ? 3 : 0 }} />
              <span className="text-[10px] text-foreground-muted">{s.dia.slice(8, 10)}/{s.dia.slice(5, 7)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Top páginas + Top cliques */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListaTop titulo="Páginas mais vistas" subtitulo="Onde o público mais entra." rows={paths} cor="#05474A" />
        <ListaTop titulo="Mais clicados" subtitulo="Botões e links que mais recebem cliques." rows={clicks} cor="#53C4CC"
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

        <ListaTop titulo="De onde vêm" subtitulo="Sites que trouxeram visitantes (origem externa)." rows={referrers} cor="#F5C84B" />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <Globe className="h-3.5 w-3.5" /> Analytics próprio, sem cookies de rastreio de terceiros, sem IP e sem dado pessoal. As áreas de admin e estúdio não são contadas.
      </p>
    </div>
  );
}

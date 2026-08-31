import Link from "next/link";
import {
  Users,
  ShieldCheck,
  CreditCard,
  Newspaper,
  ArrowRight,
  TrendingUp,
  Globe2,
  Clock,
  AlertCircle,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { getMetrics } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/whatsapp";
import { PLAN_LABEL } from "@/lib/plan-labels";

export const metadata = { title: "Visão geral" };

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  tone = "brand",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  tone?: "brand" | "teal" | "yellow" | "neutral";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand/10 text-brand-dark",
    teal: "bg-teal-100 text-teal-800",
    yellow: "bg-yellow-400/20 text-yellow-700",
    neutral: "bg-surface-muted text-foreground-muted",
  };
  const inner = (
    <div className="rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-heading">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
      {sub && <p className="mt-1 text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

const PLAN_ORDER = ["essencial", "destaque", "ideal", "presenca"] as const;
const PLAN_COLOR: Record<string, string> = {
  essencial: "bg-neutral-400",
  destaque: "bg-teal-400",
  ideal: "bg-brand",
  presenca: "bg-yellow-500",
};

export default async function AdminDashboard() {
  const m = await getMetrics();
  const maxPlan = Math.max(1, ...PLAN_ORDER.map((p) => m.planos[p]));

  // Detalhes extras: alcance e qualidade da base publicada.
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const cnt = async (b: PromiseLike<{ count: number | null }>) => (await b).count ?? 0;
  const P = () => admin.from("psychologists").select("*", { count: "exact", head: true });
  const Ppub = () => P().eq("is_published", true);
  const [emTesteVoz, extPub, completoPub, fotoPub, videoPub, valorPub, pagantes] = await Promise.all([
    cnt(P().eq("trial_tier", "ideal").gt("trial_ends_at", nowIso)),
    cnt(Ppub().eq("attends_abroad", true)),
    cnt(Ppub().eq("profile_completed", true)),
    cnt(Ppub().not("avatar_url", "is", null)),
    cnt(Ppub().not("video_url", "is", null)),
    cnt(Ppub().gt("session_price_cents", 0)),
    cnt(P().eq("subscription_status", "ativa").neq("plan_tier", "essencial")),
  ]);
  const pub = Math.max(1, m.psicologos.publicados);
  const pct = (n: number) => Math.round((n / pub) * 100);
  const totalBase = Math.max(1, m.psicologos.total);
  const qualidade = [
    { label: "Com foto", n: fotoPub, ajuda: "Perfis publicados que já têm foto de perfil." },
    { label: "Perfil completo", n: completoPub, ajuda: "Preencheram todos os campos obrigatórios." },
    { label: "Com valor da sessão", n: valorPub, ajuda: "Mostram o preço no perfil (planos pagos)." },
    { label: "Com vídeo", n: videoPub, ajuda: "Colaram um vídeo de apresentação (plano Voz)." },
    { label: "Atende no exterior", n: extPub, ajuda: "Marcaram que atendem brasileiros fora do Brasil." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Visão geral</h1>
        <p className="mt-1 text-foreground-muted">
          O panorama da Ayumana. Todos os números vêm direto do banco, atualizados a cada carregamento. Clique num cartão para abrir a lista por trás dele.
        </p>
      </div>

      {/* Cards principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Psicólogos publicados"
          value={m.psicologos.publicados}
          sub={`${m.psicologos.total} no total · ${m.psicologos.rascunhos} rascunhos`}
          href="/admin/usuarios"
          tone="brand"
        />
        <StatCard
          icon={ShieldCheck}
          label="Verificações pendentes"
          value={m.verificacao.pendente}
          sub={`${m.verificacao.aprovado} verificados`}
          href="/admin/verificacao"
          tone={m.verificacao.pendente > 0 ? "yellow" : "neutral"}
        />
        <StatCard
          icon={CreditCard}
          label="MRR estimado"
          value={formatPrice(m.assinaturas.mrrCents) ?? "R$ 0,00"}
          sub={`${m.assinaturas.ativas} assinatura(s) ativa(s)`}
          href="/admin/assinaturas"
          tone="teal"
        />
        <StatCard
          icon={Newspaper}
          label="Artigos publicados"
          value={m.conteudo.artigosPublicados}
          sub={`${m.conteudo.perguntasPublicadas} perguntas no fórum`}
          href="/admin/blog"
          tone="neutral"
        />
      </div>

      {/* KPIs de usuários, clique abre a lista já filtrada */}
      <section>
        <h2 className="text-lg">Usuários</h2>
        <p className="mb-3 mt-0.5 text-sm text-foreground-muted">Situação dos perfis na jornada. Clique em qualquer cartão para abrir a lista já filtrada.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Aguardando aprovação"
            value={m.verificacao.pendente}
            sub="CRP em análise"
            href="/admin/usuarios?status=pendente"
            tone={m.verificacao.pendente > 0 ? "yellow" : "neutral"}
          />
          <StatCard
            icon={AlertCircle}
            label="Perfis incompletos"
            value={m.psicologos.incompletos}
            sub="Faltam dados obrigatórios"
            href="/admin/usuarios?status=incompleto"
            tone={m.psicologos.incompletos > 0 ? "yellow" : "neutral"}
          />
          <StatCard
            icon={EyeOff}
            label="Não publicados"
            value={m.psicologos.rascunhos}
            sub="Perfis em rascunho"
            href="/admin/usuarios?status=rascunho"
            tone="neutral"
          />
          <StatCard
            icon={UserPlus}
            label="Novos em 30 dias"
            value={m.psicologos.novos30d}
            sub={`${m.psicologos.total} psicólogos no total`}
            href="/admin/usuarios?papel=psicologo"
            tone="teal"
          />
        </div>
      </section>

      {/* Filas pendentes */}
      {(m.verificacao.pendente > 0 ||
        m.conteudo.perguntasPendentes > 0 ||
        m.conteudo.respostasPendentes > 0) && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-400/10 p-5">
          <h2 className="text-sm font-semibold text-yellow-800">Precisa da sua atenção</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {m.verificacao.pendente > 0 && (
              <Link href="/admin/verificacao" className="inline-flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-heading hover:shadow-sm">
                {m.verificacao.pendente} CRP para verificar <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {(m.conteudo.perguntasPendentes > 0 || m.conteudo.respostasPendentes > 0) && (
              <Link href="/admin/moderacao" className="inline-flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-sm font-medium text-heading hover:shadow-sm">
                {m.conteudo.perguntasPendentes + m.conteudo.respostasPendentes} itens para moderar <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribuição por plano */}
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Psicólogos por plano</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Quantos estão em cada plano contratado. Quem está no teste do Voz aparece no plano que assinou, não no Voz.
          </p>
          <div className="mt-5 space-y-4">
            {PLAN_ORDER.map((p) => (
              <div key={p}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{PLAN_LABEL[p]}</span>
                  <span className="text-foreground-muted"><strong className="text-heading">{m.planos[p]}</strong> · {Math.round((m.planos[p] / totalBase) * 100)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${PLAN_COLOR[p]}`}
                    style={{ width: `${(m.planos[p] / maxPlan) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-sm text-foreground-muted">
            Além destes, <strong className="text-heading">{emTesteVoz}</strong> estão com o Voz de cortesia (teste) e <strong className="text-heading">{pagantes}</strong> pagam assinatura ativa.
          </p>
        </section>

        {/* Verificação + crescimento */}
        <section className="rounded-2xl border border-border bg-background p-6">
          <h2 className="text-lg">Verificação de CRP</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Em que ponto da conferência de CRP cada perfil está. Só quem está &quot;Verificado&quot; pode aparecer publicado.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            {[
              ["Verificados", m.verificacao.aprovado, "text-green-600"],
              ["Em análise", m.verificacao.pendente, "text-yellow-600"],
              ["Não enviado", m.verificacao.nao_enviado, "text-foreground-muted"],
              ["Reprovados", m.verificacao.reprovado, "text-danger"],
            ].map(([label, val, cls]) => (
              <div key={label as string} className="rounded-xl border border-border p-4">
                <dd className={`text-2xl font-semibold ${cls}`}>{val as number}</dd>
                <dt className="text-sm text-foreground-muted">{label as string}</dt>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 text-sm">
            <span className="inline-flex items-center gap-2 text-foreground-muted">
              <TrendingUp className="h-4 w-4 text-brand" />
              <strong className="text-heading">{m.psicologos.novos30d}</strong> novos em 30 dias
            </span>
            <span className="inline-flex items-center gap-2 text-foreground-muted">
              <Globe2 className="h-4 w-4 text-teal-600" />
              <strong className="text-heading">{m.admins}</strong> admin(s)
            </span>
          </div>
        </section>
      </div>

      {/* Alcance e qualidade da base */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Alcance e qualidade da base</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">
          Dos {m.psicologos.publicados} perfis publicados, quantos já têm cada item. Serve para saber o que ainda falta puxar na base.
        </p>
        <div className="mt-5 space-y-4">
          {qualidade.map((q) => (
            <div key={q.label}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{q.label}</span>
                  <span className="ml-2 text-xs text-foreground-muted">{q.ajuda}</span>
                </div>
                <span className="shrink-0 text-sm text-foreground-muted"><strong className="text-heading">{q.n}</strong> · {pct(q.n)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct(q.n)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

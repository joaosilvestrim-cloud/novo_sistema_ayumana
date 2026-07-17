import Link from "next/link";
import {
  ShieldCheck,
  Globe2,
  Clock,
  MessageCircle,
  Search,
  MousePointerClick,
  ArrowRight,
} from "lucide-react";
import { CvvBanner } from "@/components/site/cvv-banner";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Hero } from "@/components/site/hero";
import { Button } from "@/components/ui/button";
import { PsychologistCard } from "@/components/catalog/psychologist-card";
import { listPsychologists } from "@/lib/psychologists";
import { listPosts } from "@/lib/blog";
import { COUNTRY_LANDINGS } from "@/lib/countries-content";

const DIFERENCIAIS = [
  {
    icon: Globe2,
    title: "Atende brasileiros no exterior",
    desc: "Filtre por profissionais que acolhem quem vive fora e entende a dor de estar longe.",
  },
  {
    icon: Clock,
    title: "Fuso horário compatível",
    desc: "Encontre horários que funcionam onde você mora, de Portugal ao Japão.",
  },
  {
    icon: ShieldCheck,
    title: "CRP verificado",
    desc: "Todo psicólogo passa por verificação do registro no Conselho antes de aparecer.",
  },
  {
    icon: MessageCircle,
    title: "Contato direto no WhatsApp",
    desc: "Sem intermediação: você fala direto com o profissional e marca do seu jeito.",
  },
];

const PASSOS = [
  {
    icon: Search,
    title: "Busque e filtre",
    desc: "Por queixa, abordagem, fuso horário e se atende brasileiros no exterior.",
  },
  {
    icon: MousePointerClick,
    title: "Escolha o profissional",
    desc: "Veja o perfil completo, com CRP verificado, especialidades e valores.",
  },
  {
    icon: MessageCircle,
    title: "Converse no WhatsApp",
    desc: "Fale direto com o psicólogo e combine a primeira sessão do seu jeito.",
  },
];

function fmtDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default async function HomePage() {
  const [{ rows: destaques }, posts] = await Promise.all([
    listPsychologists({ page: 1 }),
    listPosts(3),
  ]);
  const featured = destaques.slice(0, 6);

  return (
    <>
      <CvvBanner />
      <SiteHeader />

      <main className="flex-1">
        <Hero />

        {/* Como funciona */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-heading">Como funciona</h2>
            <p className="mt-3 text-foreground-muted">
              Três passos entre você e o cuidado em português.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PASSOS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative rounded-2xl border border-border bg-background p-6">
                <span className="absolute right-5 top-5 text-4xl font-semibold text-surface-muted">
                  {i + 1}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Diferenciais exterior */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold text-heading">
                Feito para quem fala português
              </h2>
              <p className="mt-3 text-foreground-muted">
                De brasileiros para brasileiros — inclusive para quem mora longe de casa.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {DIFERENCIAIS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-border bg-background p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg">{title}</h3>
                  <p className="mt-2 text-sm text-foreground-muted">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Psicólogos em destaque */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold text-heading">
                  Psicólogos em destaque
                </h2>
                <p className="mt-2 text-foreground-muted">
                  Profissionais verificados prontos para te atender.
                </p>
              </div>
              <Link
                href="/psicologos"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <PsychologistCard key={p.id} p={p} stacked />
              ))}
            </div>
          </section>
        )}

        {/* Você mora fora? — países */}
        <section className="border-y border-border bg-brand-dark">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <Globe2 className="h-3.5 w-3.5" /> Você mora fora?
              </span>
              <h2 className="mt-4 text-3xl font-semibold text-white">
                Psicólogos brasileiros para onde você estiver
              </h2>
              <p className="mt-3 text-white/75">
                Atendimento em português, no seu fuso. Escolha seu país:
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {COUNTRY_LANDINGS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/no-exterior/${c.slug}`}
                  className="group flex items-center justify-between gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/20"
                >
                  {c.name}
                  <ArrowRight className="h-4 w-4 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Do nosso blog */}
        {posts.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-semibold text-heading">Do nosso blog</h2>
                <p className="mt-2 text-foreground-muted">
                  Saúde mental em português, com foco em quem vive longe de casa.
                </p>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
              >
                Ver o blog <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-md"
                >
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 to-green-100" />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-teal-600">
                      {p.category}
                    </span>
                    <h3 className="mt-2 line-clamp-2 font-semibold text-heading group-hover:text-brand-dark">
                      {p.title}
                    </h3>
                    <p className="mt-3 text-xs text-foreground-muted">
                      {p.author_name} · {fmtDate(p.published_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA psicólogos */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-16 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-heading md:text-3xl">
                É psicólogo? Apareça para quem procura por você.
              </h2>
              <p className="mt-2 max-w-xl text-foreground-muted">
                Comece grátis: monte seu perfil, verifique seu CRP e apareça na
                busca. Sem comissão sobre suas sessões.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button href="/cadastro" size="lg">
                Criar meu perfil
              </Button>
              <Button href="/para-psicologos" size="lg" variant="outline">
                Ver planos
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Globe2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { CvvBanner } from "@/components/site/cvv-banner";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Button } from "@/components/ui/button";

const QUEIXAS = [
  "Ansiedade",
  "Depressão",
  "Saudade / adaptação no exterior",
  "Relacionamentos",
  "Autoestima",
  "Luto",
  "Estresse",
  "Maternidade",
];

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

export default function HomePage() {
  return (
    <>
      <CvvBanner />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-surface">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-brand-dark">
              <span className="h-2 w-2 rounded-full bg-brand" />
              Psicoterapia com alma brasileira
            </span>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-tight text-heading md:text-5xl">
              Encontre seu psicólogo,
              <br className="hidden sm:block" /> no Brasil ou no exterior
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-foreground-muted">
              Terapia em português, onde você estiver. Psicólogos brasileiros
              verificados, atendimento online e contato direto pelo WhatsApp.
            </p>

            {/* Busca */}
            <form
              action="/psicologos"
              className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm"
            >
              <div className="flex flex-1 items-center gap-2 pl-3">
                <Search className="h-5 w-5 shrink-0 text-foreground-muted" />
                <input
                  type="text"
                  name="q"
                  placeholder="Busque por queixa, abordagem ou nome"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-foreground-muted"
                />
              </div>
              <Button type="submit" size="md">
                Buscar
              </Button>
            </form>

            {/* Atalhos por queixa */}
            <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
              {QUEIXAS.map((q) => (
                <Link
                  key={q}
                  href={`/psicologos?q=${encodeURIComponent(q)}`}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-brand hover:text-brand-dark"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-heading">
              Feito para quem fala português
            </h2>
            <p className="mt-3 text-foreground-muted">
              De brasileiros para brasileiros — inclusive para quem mora longe de
              casa.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFERENCIAIS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg">{title}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA psicólogos */}
        <section className="bg-brand-dark">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-14 text-center md:flex-row md:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-white md:text-3xl">
                É psicólogo? Apareça para quem procura por você.
              </h2>
              <p className="mt-2 max-w-xl text-white/70">
                Comece grátis: monte seu perfil, verifique seu CRP e apareça na
                busca. Sem comissão sobre suas sessões.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Button
                href="/cadastro"
                size="lg"
                className="bg-brand text-white hover:bg-primary-hover"
              >
                Criar meu perfil
              </Button>
              <Button
                href="/para-psicologos"
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
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

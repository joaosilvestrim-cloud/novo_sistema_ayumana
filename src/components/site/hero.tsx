import Link from "next/link";
import { Search, ShieldCheck, Globe2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "@/components/site/hero-visual";
import type { HeroPerson } from "@/lib/psychologists";

const QUEIXAS = [
  "Ansiedade",
  "Saudade de casa",
  "Relacionamentos",
  "Autoestima",
  "Luto",
];

export function Hero({ people = [] }: { people?: HeroPerson[] }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* fundo: gradiente + blobs orgânicos animados */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface via-background to-background" />
      <div className="ayu-blob absolute -left-24 top-8 -z-10 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div
        className="ayu-blob absolute -right-16 top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="ayu-blob absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-highlight/10 blur-3xl"
        style={{ animationDelay: "6s" }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        {/* Coluna de conteúdo */}
        <div className="ayu-rise">
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-heading sm:text-5xl lg:text-[3.4rem]">
            Terapia em português,{" "}
            <span className="relative whitespace-nowrap text-brand">
              onde você estiver
              <svg
                className="absolute -bottom-2 left-0 w-full text-brand/40"
                viewBox="0 0 300 12"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2 9C60 3 120 3 180 6C220 8 260 8 298 4"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          <p className="mt-6 max-w-lg text-lg text-foreground-muted">
            Psicólogos brasileiros com CRP verificado. Encontre, filtre por fuso
            horário e fale direto pelo WhatsApp — no Brasil ou no exterior.
          </p>

          {/* Busca */}
          <form
            action="/psicologos"
            className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg shadow-teal-900/5"
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

          {/* Chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            {QUEIXAS.map((q) => (
              <Link
                key={q}
                href={`/psicologos?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-border bg-background/70 px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-brand hover:text-brand-dark"
              >
                {q}
              </Link>
            ))}
          </div>

          {/* Prova social */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              CRP verificado
            </span>
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-teal-600" />
              Atende em 10+ países
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              Sem comissão sobre a sessão
            </span>
          </div>
        </div>

        {/* Coluna visual (rotaciona entre os psicólogos IDEAL reais) */}
        <HeroVisual people={people} />
      </div>
    </section>
  );
}

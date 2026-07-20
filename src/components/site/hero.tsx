import Link from "next/link";
import { Search, ShieldCheck, Globe2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUEIXAS = [
  "Ansiedade",
  "Saudade de casa",
  "Relacionamentos",
  "Autoestima",
  "Luto",
];

const FLOATING = [
  {
    initials: "MA",
    name: "Mariana A.",
    role: "TCC · atende no exterior",
    flag: "🇵🇹",
    place: "Portugal",
    tone: "bg-teal-100 text-teal-800",
    cls: "ayu-float",
    style: { top: "4%", right: "6%" },
    delay: "0s",
  },
  {
    initials: "RS",
    name: "Rafael S.",
    role: "Psicanálise",
    flag: "🇺🇸",
    place: "EUA",
    tone: "bg-green-100 text-green-800",
    cls: "ayu-float-slow",
    style: { top: "40%", right: "40%" },
    delay: "1.2s",
  },
  {
    initials: "CN",
    name: "Camila N.",
    role: "Infância · bilíngues",
    flag: "🇮🇪",
    place: "Irlanda",
    tone: "bg-yellow-400/20 text-yellow-600",
    cls: "ayu-float",
    style: { bottom: "6%", right: "10%" },
    delay: "0.6s",
  },
];

const COUNTRY_PILLS = [
  { flag: "🇩🇪", label: "Alemanha", style: { top: "24%", right: "34%" }, cls: "ayu-float-slow", delay: "0.3s" },
  { flag: "🇯🇵", label: "Japão", style: { bottom: "28%", right: "48%" }, cls: "ayu-float", delay: "1.6s" },
];

export type HeroPerson = {
  name: string | null;
  role: string;
  place: string;
  avatar_url: string | null;
  slug: string | null;
};

function firstNames(name: string | null): string {
  if (!name) return "Psicólogo(a)";
  const parts = name.trim().split(/\s+/).filter((w) => !/^(dr|dra|prof|profa)\.?$/i.test(w));
  // Primeiro nome + inicial do segundo (privacidade leve, como no visual antigo).
  return parts[1] ? `${parts[0]} ${parts[1][0]}.` : parts[0] || "Psicólogo(a)";
}

function HeroVisual({ people = [] }: { people?: HeroPerson[] }) {
  return (
    <div className="relative hidden h-[440px] lg:block" aria-hidden>
      {/* anel orgânico que ecoa o símbolo da marca */}
      <div className="absolute right-[14%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-[46%_54%_60%_40%/48%_42%_58%_52%] border-2 border-brand/30" />
      <div className="absolute right-[10%] top-1/2 h-80 w-80 -translate-y-1/2 rounded-[54%_46%_40%_60%/58%_52%_48%_42%] border border-accent/30" />

      {COUNTRY_PILLS.map((c) => (
        <div
          key={c.label}
          className={`absolute ${c.cls} rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-heading shadow-sm backdrop-blur`}
          style={{ ...c.style, animationDelay: c.delay }}
        >
          <span className="mr-1">{c.flag}</span>
          {c.label}
        </div>
      ))}

      {FLOATING.map((fake, i) => {
        const real = people[i];
        const name = real ? firstNames(real.name) : fake.name;
        const role = real ? real.role : fake.role;
        const place = real ? real.place : `${fake.flag} ${fake.place}`;
        const inner = (
          <>
            <div className="flex items-center gap-3">
              {real?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={real.avatar_url}
                  alt={name ?? "Psicólogo"}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${fake.tone}`}>
                  {fake.initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-semibold text-heading">{name}</p>
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
                </div>
                <p className="truncate text-xs text-foreground-muted">{role}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
              <span className="truncate text-xs text-foreground-muted">{place}</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-green-700">
                <span className="ayu-pulse-dot h-1.5 w-1.5 rounded-full bg-green-500" />
                online
              </span>
            </div>
          </>
        );
        const cardCls = `absolute ${fake.cls} w-56 rounded-2xl border border-border bg-background/95 p-3.5 shadow-lg shadow-teal-900/5 backdrop-blur`;
        return real?.slug ? (
          <Link key={i} href={`/psicologo/${real.slug}`} className={cardCls} style={{ ...fake.style, animationDelay: fake.delay }}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={cardCls} style={{ ...fake.style, animationDelay: fake.delay }}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

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

        {/* Coluna visual */}
        <HeroVisual />
      </div>
    </section>
  );
}

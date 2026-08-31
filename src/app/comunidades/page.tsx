import Link from "next/link";
import { Globe2, Users2, Heart, ArrowRight, MessageCircle } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { listPublicCommunities } from "@/lib/communities";
import { COUNTRIES } from "@/lib/types";

export const metadata = {
  title: "Ayumana nas Comunidades",
  description:
    "Conversas sobre a vida emocional de quem vive longe de casa. A Ayumana cria ações gratuitas com comunidades brasileiras no exterior e conecta a psicólogos com CRP verificado.",
  alternates: { canonical: "/comunidades" },
};

const TEMAS = ["Saudade", "Adaptação", "Maternidade longe da rede de apoio", "Relacionamentos", "Filhos entre culturas", "Ansiedade", "Burnout", "Pertencimento"];
const paisNome = (code: string) => COUNTRIES.find((p) => p.code === code)?.name ?? code;

export default async function ComunidadesHubPage() {
  const comunidades = await listPublicCommunities();
  const wa = process.env.SUPPORT_WHATSAPP || "5511930662105";
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent("Olá! Quero levar a Ayumana para a minha comunidade.")}`;

  return (
    <PageShell>
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-sm font-medium text-brand-dark">
            <Users2 className="h-4 w-4" /> Ayumana nas Comunidades
          </span>
          <h1 className="mt-5 text-4xl font-semibold text-heading">
            Conversas sobre a vida emocional de quem vive longe de casa
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-foreground-muted">
            A Ayumana cria ações gratuitas com comunidades brasileiras no exterior e conecta você a psicólogos brasileiros com CRP verificado, em português.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/psicologos?exterior=1" size="lg">Encontrar um psicólogo</Button>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-5 font-medium text-heading hover:bg-surface-muted">
              <MessageCircle className="h-5 w-5" /> Levar para minha comunidade
            </a>
          </div>
        </div>
      </section>

      {/* Comunidades parceiras */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold text-heading">Comunidades parceiras</h2>
        <p className="mt-1 text-foreground-muted">Associações e grupos que já caminham com a Ayumana.</p>
        {comunidades.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-10 text-center text-foreground-muted">
            Em breve. Estamos construindo as primeiras parcerias.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comunidades.map((c) => (
              <Link key={c.id} href={`/comunidades/${c.slug}`} className="group flex flex-col rounded-2xl border border-border bg-background p-5 transition-colors hover:border-brand hover:bg-brand/5">
                <div className="flex items-center gap-3">
                  {c.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo_url} alt={c.name} className="h-10 w-10 rounded-lg object-contain" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand-dark"><Users2 className="h-5 w-5" /></span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-heading group-hover:text-brand-dark">{c.name}</p>
                    <p className="flex items-center gap-1 text-xs text-foreground-muted"><Globe2 className="h-3.5 w-3.5" /> {paisNome(c.country_code)}{c.city_region ? ` · ${c.city_region}` : ""}</p>
                  </div>
                </div>
                {c.headline && <p className="mt-3 line-clamp-2 text-sm text-foreground-muted">{c.headline}</p>}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-dark">Ver página <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Temas */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-heading">Temas dos nossos encontros</h2>
          <p className="mt-1 text-foreground-muted">Assuntos que tocam quem vive fora do Brasil.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TEMAS.map((t) => (
              <span key={t} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground-muted">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Para líderes */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-brand/30 bg-brand/5 p-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-semibold text-heading"><Heart className="h-6 w-6 text-brand-dark" /> Lidera uma comunidade brasileira no exterior?</h2>
            <p className="mt-2 max-w-xl text-foreground-muted">
              A gente monta uma ação gratuita de saúde emocional sob medida para os seus membros, com psicólogos brasileiros verificados. Sem custo para a comunidade.
            </p>
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-hover">
            Quero levar a Ayumana
          </a>
        </div>
      </section>
    </PageShell>
  );
}

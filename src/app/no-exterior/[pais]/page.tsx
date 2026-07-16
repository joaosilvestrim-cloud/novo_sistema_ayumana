import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Globe2, ShieldCheck, Check } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { PsychologistCard } from "@/components/catalog/psychologist-card";
import { Button } from "@/components/ui/button";
import { COUNTRY_LANDINGS, getCountryLanding } from "@/lib/countries-content";
import { listPsychologists } from "@/lib/psychologists";

export function generateStaticParams() {
  return COUNTRY_LANDINGS.map((c) => ({ pais: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pais: string }>;
}): Promise<Metadata> {
  const { pais } = await params;
  const c = getCountryLanding(pais);
  if (!c) return { title: "País não encontrado" };
  return {
    title: c.headline,
    description: c.intro,
    alternates: { canonical: `/no-exterior/${c.slug}` },
    openGraph: { title: c.headline, description: c.intro, type: "website" },
  };
}

export default async function CountryLandingPage({
  params,
}: {
  params: Promise<{ pais: string }>;
}) {
  const { pais } = await params;
  const c = getCountryLanding(pais);
  if (!c) notFound();

  const { rows } = await listPsychologists({ pais: c.code, exterior: true });

  return (
    <PageShell>
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-teal-700">
            <Globe2 className="h-3.5 w-3.5" /> Para brasileiros {c.demonym}
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-heading">
            {c.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-foreground-muted">{c.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground-muted">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-600" /> CRP verificado
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-600" /> {c.timezoneHint}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        {/* Dores locais */}
        <section className="mb-12">
          <h2 className="text-2xl">O que costuma pesar {c.demonym}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {c.pains.map((p) => (
              <li key={p} className="flex items-start gap-2 rounded-xl border border-border bg-background p-4 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* Catálogo filtrado */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl">Psicólogos que atendem {c.demonym}</h2>
            <Link
              href={`/psicologos?pais=${c.code}`}
              className="text-sm font-medium text-brand-dark hover:underline"
            >
              Ver todos →
            </Link>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
              <p className="text-heading">
                Ainda estamos reunindo profissionais para {c.name}.
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                Enquanto isso, veja todos os que atendem no exterior.
              </p>
              <Button href="/psicologos?exterior=1" className="mt-4">
                Ver psicólogos
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((p) => (
                <PsychologistCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>

        {/* Links para outros países */}
        <section className="mt-16 border-t border-border pt-8">
          <h2 className="text-lg">Brasileiros em outros países</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COUNTRY_LANDINGS.filter((x) => x.slug !== c.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/no-exterior/${x.slug}`}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-brand hover:text-brand-dark"
              >
                {x.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

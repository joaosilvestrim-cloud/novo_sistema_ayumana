import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ShieldCheck, MessageCircle, Globe2, CalendarClock, ArrowRight, MessageSquare, Check,
} from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { PsychologistCard } from "@/components/catalog/psychologist-card";
import { getPublicCommunity, listCommunityEvents, listCuratedPsychologistIds } from "@/lib/communities";
import { listPsychologists, listPsychologistsByIds } from "@/lib/psychologists";
import { listOpenQuestions } from "@/lib/forum";
import { COUNTRIES } from "@/lib/types";
import { COUNTRY_LANDINGS } from "@/lib/countries-content";

const TEMAS_PADRAO = ["Ansiedade", "Saudade", "Adaptação", "Maternidade", "Relacionamentos", "Filhos bilíngues", "Burnout", "Pertencimento"];
const paisNome = (code: string) => COUNTRIES.find((p) => p.code === code)?.name ?? code;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublicCommunity(slug);
  if (!c) return { title: "Comunidade não encontrada" };
  const title = c.seo_title || `${c.name} · Ayumana nas Comunidades`;
  const description = c.seo_description || c.headline || `Terapia em português para a comunidade ${c.name}, ${paisNome(c.country_code)}. Psicólogos brasileiros com CRP verificado.`;
  return {
    title,
    description,
    alternates: { canonical: `/comunidades/${c.slug}` },
    openGraph: { title, description, type: "website", url: `/comunidades/${c.slug}`, siteName: "Ayumana" },
  };
}

export default async function ComunidadeLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getPublicCommunity(slug);
  if (!c) notFound();

  const [{ rows: psisAuto }, eventos, perguntas, curatedIds] = await Promise.all([
    listPsychologists({ pais: c.country_code, exterior: true }),
    listCommunityEvents(c.id),
    listOpenQuestions(4),
    listCuratedPsychologistIds(c.id),
  ]);
  // Curadoria manda; sem curadoria, mostra automaticamente quem atende no país/exterior.
  const destaque = curatedIds.length ? (await listPsychologistsByIds(curatedIds)).slice(0, 6) : psisAuto.slice(0, 4);
  const pais = paisNome(c.country_code);
  const buscaHref = `/psicologos?pais=${c.country_code}&exterior=1`;
  const countryLanding = COUNTRY_LANDINGS.find((l) => l.code === c.country_code);
  const proximos = eventos.filter((e) => e.status === "proximo");

  const fmtEvento = (iso: string | null) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }) : "Data a confirmar");

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-4 pt-6 text-sm text-foreground-muted">
        <Link href="/comunidades" className="hover:text-brand-dark">Comunidades</Link>
        <span className="mx-1.5">›</span>
        <span className="text-heading">{c.name}</span>
      </div>

      {/* Hero co-branded */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-border bg-surface p-8 md:p-12">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
              <ShieldCheck className="h-3.5 w-3.5" /> Parceria Ayumana
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-foreground-muted"><Globe2 className="h-4 w-4" /> {pais}{c.city_region ? ` · ${c.city_region}` : ""}</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            {c.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logo_url} alt={c.name} className="h-14 w-14 rounded-xl bg-white object-contain p-1 shadow-sm" />
            )}
            <h1 className="text-3xl font-semibold text-heading md:text-4xl">
              {c.headline || `Terapia em português para a comunidade ${c.name}`}
            </h1>
          </div>
          {c.intro_text && <p className="mt-4 max-w-2xl text-lg text-foreground-muted">{c.intro_text}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={buscaHref} size="lg">Encontrar um psicólogo</Button>
            {proximos.length > 0 && (
              <a href="#encontros" className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-5 font-medium text-heading hover:bg-surface-muted">
                <CalendarClock className="h-5 w-5" /> Ver próximo encontro
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Encontre um psicólogo */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-heading">Psicólogos para brasileiros em {pais}</h2>
            <p className="mt-1 text-foreground-muted">Profissionais com CRP verificado que atendem no seu fuso. Contato direto pelo WhatsApp.</p>
          </div>
          <Link href={buscaHref} className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">Ver todos <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {destaque.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {destaque.map((p) => <PsychologistCard key={p.id} p={p} />)}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-8 text-center text-foreground-muted">
            Estamos ampliando a rede para {pais}. <Link href="/psicologos?exterior=1" className="font-medium text-brand-dark hover:underline">Ver quem atende no exterior</Link>.
          </div>
        )}
      </section>

      {/* Temas */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-xl font-semibold text-heading">Temas mais comuns de quem vive em {pais}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(c.themes.length ? c.themes : TEMAS_PADRAO).map((t) => (
            <Link key={t} href={`/psicologos?exterior=1&pais=${c.country_code}&q=${encodeURIComponent(t)}`} className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:border-brand hover:text-brand-dark">
              {t}
            </Link>
          ))}
        </div>
      </section>

      {/* Próximos encontros */}
      {proximos.length > 0 && (
        <section id="encontros" className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-2xl font-semibold text-heading">Próximos encontros</h2>
          <div className="mt-5 space-y-4">
            {proximos.map((ev) => (
              <div key={ev.id} className="rounded-2xl border border-border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    {ev.slug ? (
                      <Link href={`/comunidades/${c.slug}/${ev.slug}`} className="text-lg font-semibold text-heading hover:text-brand-dark hover:underline">{ev.title}</Link>
                    ) : (
                      <p className="text-lg font-semibold text-heading">{ev.title}</p>
                    )}
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-brand-dark"><CalendarClock className="h-4 w-4" /> {fmtEvento(ev.starts_at)}</p>
                    {ev.theme && <p className="mt-1 text-sm text-foreground-muted">{ev.theme}</p>}
                    {ev.description && <p className="mt-2 max-w-2xl text-sm text-foreground-muted">{ev.description}</p>}
                    {ev.speaker && <p className="mt-2 text-xs text-foreground-muted">Com {ev.speaker}</p>}
                  </div>
                  {ev.signup_url && (
                    <a href={ev.signup_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                      Participar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fórum */}
      {perguntas.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-heading"><MessageSquare className="h-6 w-6 text-teal-600" /> Perguntas da comunidade</h2>
          <p className="mt-1 text-foreground-muted">Dúvidas reais respondidas por psicólogos com CRP verificado.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {perguntas.map((q) => (
              <Link key={q.id} href={`/perguntas/${q.slug}`} className="block rounded-xl border border-border p-4 transition-colors hover:border-brand hover:bg-brand/5">
                <p className="font-medium text-heading">{q.title}</p>
                <span className="mt-2 inline-block text-xs font-medium text-brand-dark">Ver respostas →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border border-border bg-surface-muted/40 p-6">
          <h2 className="text-xl font-semibold text-heading">Como funciona a Ayumana</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Todo psicólogo tem o CRP verificado pela nossa equipe.", "Você fala direto com o profissional pelo WhatsApp.", "A Ayumana não cobra comissão sobre a sessão."].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-foreground-muted"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final + país */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-8 text-center">
          <h2 className="text-2xl font-semibold text-heading">Encontre seu psicólogo em português</h2>
          <p className="max-w-xl text-foreground-muted">Da comunidade {c.name} para o cuidado que cabe na sua rotina, onde você estiver.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button href={buscaHref} size="lg"><MessageCircle className="h-5 w-5" /> Encontrar um psicólogo</Button>
            {countryLanding && (
              <Link href={`/no-exterior/${countryLanding.slug}`} className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-5 font-medium text-heading hover:bg-surface-muted">
                Brasileiros em {pais}
              </Link>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

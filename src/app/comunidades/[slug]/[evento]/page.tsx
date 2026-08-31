import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarClock, ArrowLeft, MessageCircle, Check } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Button } from "@/components/ui/button";
import { getPublicCommunity, getCommunityEventBySlug } from "@/lib/communities";
import { COUNTRIES } from "@/lib/types";

const paisNome = (code: string) => COUNTRIES.find((p) => p.code === code)?.name ?? code;

export async function generateMetadata({ params }: { params: Promise<{ slug: string; evento: string }> }): Promise<Metadata> {
  const { slug, evento } = await params;
  const c = await getPublicCommunity(slug);
  if (!c) return { title: "Evento não encontrado" };
  const ev = await getCommunityEventBySlug(c.id, evento);
  if (!ev) return { title: "Evento não encontrado" };
  const title = `${ev.title} · ${c.name}`;
  const description = ev.description || `Encontro gratuito da comunidade ${c.name} sobre ${ev.theme || "saúde emocional"}.`;
  return { title, description, alternates: { canonical: `/comunidades/${c.slug}/${ev.slug}` }, openGraph: { title, description, type: "website", siteName: "Ayumana" } };
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string; evento: string }> }) {
  const { slug, evento } = await params;
  const c = await getPublicCommunity(slug);
  if (!c) notFound();
  const ev = await getCommunityEventBySlug(c.id, evento);
  if (!ev) notFound();

  const pais = paisNome(c.country_code);
  const buscaHref = `/psicologos?pais=${c.country_code}&exterior=1`;
  const quando = ev.starts_at ? new Date(ev.starts_at).toLocaleString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Data a confirmar";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    description: ev.description || undefined,
    ...(ev.starts_at ? { startDate: ev.starts_at } : {}),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: ev.status === "cancelado" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    organizer: { "@type": "Organization", name: "Ayumana", url: "https://ayumana.com.br" },
    ...(ev.signup_url ? { url: ev.signup_url } : {}),
  };

  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/comunidades/${c.slug}`} className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-brand-dark">
          <ArrowLeft className="h-4 w-4" /> {c.name}
        </Link>

        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-dark">
          Encontro da comunidade · {pais}
        </span>
        <h1 className="mt-3 text-3xl font-semibold text-heading md:text-4xl">{ev.title}</h1>
        <p className="mt-3 flex items-center gap-2 text-brand-dark"><CalendarClock className="h-5 w-5" /> {quando}</p>
        {ev.theme && <p className="mt-1 text-foreground-muted">Tema: {ev.theme}</p>}
        {ev.speaker && <p className="mt-1 text-sm text-foreground-muted">Com {ev.speaker}</p>}

        {ev.description && <p className="mt-6 whitespace-pre-line text-lg text-foreground-muted">{ev.description}</p>}

        <div className="mt-8 flex flex-wrap gap-3">
          {ev.signup_url && ev.status === "proximo" && (
            <a href={ev.signup_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary-hover">
              Participar do encontro
            </a>
          )}
          {ev.recording_url && ev.status === "realizado" && (
            <a href={ev.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg border border-border px-5 font-medium text-heading hover:bg-surface-muted">
              Ver gravação
            </a>
          )}
          <Button href={buscaHref} size="lg"><MessageCircle className="h-5 w-5" /> Encontrar um psicólogo</Button>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface-muted/40 p-5">
          <h2 className="text-lg font-semibold text-heading">Como funciona a Ayumana</h2>
          <ul className="mt-3 space-y-2">
            {["CRP verificado pela nossa equipe.", "Contato direto pelo WhatsApp.", "Sem comissão sobre a sessão."].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-foreground-muted"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {t}</li>
            ))}
          </ul>
        </div>
      </div>
    </PageShell>
  );
}

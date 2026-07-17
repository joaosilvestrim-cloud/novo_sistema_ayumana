import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Globe2,
  MapPin,
  MessageCircle,
  Clock,
  Languages,
  Video,
  Users,
  CalendarClock,
  GraduationCap,
  Check,
} from "lucide-react";
import {
  DAY_ORDER,
  DAY_LABEL,
  isForeignTz,
  convertHHMM,
  tzLabel,
  BR_TZ,
} from "@/lib/schedule";
import { StyleSignature } from "@/components/style-signature";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
import { PageShell } from "@/components/site/page-shell";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ShareProfile } from "@/components/share-profile";
import { getPsychologistBySlug } from "@/lib/psychologists";
import { whatsappLink, formatPrice, instagramHandle } from "@/lib/whatsapp";
import {
  AUDIENCE_LABELS,
  COUNTRIES,
  type Audience,
} from "@/lib/types";

const PAID = new Set(["destaque", "ideal", "presenca"]);
const VIDEO_PLANS = new Set(["ideal", "presenca"]);

/** Primeiro nome ignorando pronomes de tratamento (Dr., Dra., Prof.). */
function firstNameOf(name?: string | null): string | undefined {
  if (!name) return undefined;
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((w) => !/^(dr|dra|prof|profa)\.?$/i.test(w));
  return parts[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPsychologistBySlug(slug);
  if (!p) return { title: "Perfil não encontrado" };

  const title = `${p.display_name}${p.approaches[0] ? ` · ${p.approaches[0].name}` : ""}`;
  const description =
    p.headline ||
    p.bio?.slice(0, 155) ||
    `Psicólogo(a) brasileiro(a) com CRP verificado. Atendimento em português.`;

  return {
    title,
    description,
    alternates: { canonical: `/psicologo/${p.slug}` },
    openGraph: {
      title: `${p.display_name} · Ayumana`,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${p.display_name} · Ayumana`,
      description,
    },
  };
}

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPsychologistBySlug(slug);
  if (!p) notFound();

  const wa = whatsappLink(p.phone_whatsapp, p.whatsapp_message);
  const ig = instagramHandle(p.instagram);
  const price = PAID.has(p.plan_tier) ? formatPrice(p.session_price_cents) : null;
  const showVideo = VIDEO_PLANS.has(p.plan_tier) && !!p.video_url;
  const countryNames = p.countries
    .map((c) => COUNTRIES.find((x) => x.code === c)?.name)
    .filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.display_name,
    jobTitle: "Psicólogo(a)",
    description: p.headline || p.bio || undefined,
    knowsLanguage: p.languages,
    knowsAbout: p.specialties.map((s) => s.name),
    address:
      p.city || p.state
        ? {
            "@type": "PostalAddress",
            addressLocality: p.city || undefined,
            addressRegion: p.state || undefined,
            addressCountry: p.country,
          }
        : undefined,
    areaServed: p.attends_abroad ? countryNames : undefined,
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        serviceType: "Psicoterapia online",
      },
      ...(price ? { price: (p.session_price_cents ?? 0) / 100, priceCurrency: "BRL" } : {}),
    },
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link href="/psicologos" className="text-sm text-foreground-muted hover:text-brand-dark">
          ← Voltar para a busca
        </Link>

        <div className="mt-4 grid gap-8 md:grid-cols-[1fr_300px]">
          {/* Conteúdo principal */}
          <div className="space-y-8">
            <header className="flex items-start gap-5">
              <Avatar src={p.avatar_url} name={p.display_name} size={80} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl">{p.display_name}</h1>
                  <ShieldCheck className="h-5 w-5 text-green-600" aria-label="CRP verificado" />
                </div>
                <p className="mt-1 text-foreground-muted">
                  {p.approaches[0]?.name ?? "Psicólogo(a)"}
                  {p.crp_number ? ` · CRP ${p.crp_number}${p.crp_uf ? `/${p.crp_uf}` : ""}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
                  {p.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[p.city, p.state].filter(Boolean).join(" / ")}
                    </span>
                  )}
                  {p.attends_abroad && (
                    <Badge tone="brand">
                      <Globe2 className="h-3.5 w-3.5" /> Atende no exterior
                    </Badge>
                  )}
                  {p.accepting_patients && (
                    <Badge tone="success">
                      <Check className="h-3.5 w-3.5" /> Aceitando novos pacientes
                    </Badge>
                  )}
                </div>
              </div>
            </header>

            {p.headline && <p className="text-lg text-heading">{p.headline}</p>}

            {showVideo && (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-lg">
                  <Video className="h-5 w-5 text-teal-600" /> Vídeo de apresentação
                </h2>
                <a
                  href={p.video_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-dark hover:underline"
                >
                  Assistir vídeo →
                </a>
              </section>
            )}

            {p.bio && (
              <section>
                <h2 className="mb-2 text-lg">Sobre mim</h2>
                <p className="whitespace-pre-line text-foreground-muted">{p.bio}</p>
              </section>
            )}

            {(p.specialties.length > 0 || p.approaches.length > 0) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {p.specialties.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-lg">Temas e queixas atendidas</h2>
                    <div className="flex flex-wrap gap-2">
                      {p.specialties.map((s) => (
                        <Badge key={s.id} tone={s.category === "exterior" ? "brand" : "neutral"}>
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {p.approaches.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-lg">Abordagens</h2>
                    <div className="flex flex-wrap gap-2">
                      {p.approaches.map((a) => (
                        <Badge key={a.id}>{a.name}</Badge>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {(p.formation || (p.services && p.services.length > 0)) && (
              <div className="grid gap-6 rounded-2xl border border-border bg-surface-muted/40 p-5 sm:grid-cols-2">
                {p.formation && (
                  <section>
                    <h2 className="mb-2 flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5 text-teal-600" /> Formação acadêmica
                    </h2>
                    <p className="whitespace-pre-line text-sm text-foreground-muted">{p.formation}</p>
                  </section>
                )}

                {p.services && p.services.length > 0 && (
                  <section>
                    <h2 className="mb-3 text-lg">Serviços oferecidos</h2>
                    <ul className="space-y-2">
                      {p.services.map((sv) => (
                        <li key={sv} className="flex items-start gap-2 text-sm text-foreground-muted">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          {sv}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}

            {p.style && (
              <StyleSignature style={p.style} firstName={firstNameOf(p.display_name)} />
            )}

            {p.schedule && DAY_ORDER.some((d) => p.schedule?.[d]) && (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-lg">
                  <CalendarClock className="h-5 w-5 text-teal-600" /> Horário de atendimento
                </h2>
                {isForeignTz(p.timezone) && (
                  <p className="mb-3 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">
                    Horários no fuso de {tzLabel(p.timezone)}. Entre parênteses, o
                    equivalente no horário de Brasília.
                  </p>
                )}
                <div className="divide-y divide-border rounded-xl border border-border">
                  {DAY_ORDER.map((d) => {
                    const h = p.schedule?.[d];
                    return (
                      <div key={d} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-foreground">{DAY_LABEL[d]}</span>
                        {h ? (
                          <span className="text-foreground-muted">
                            {h.open}–{h.close}
                            {isForeignTz(p.timezone) && (
                              <span className="ml-2 text-xs text-teal-700">
                                (Brasília {convertHHMM(h.open, p.timezone, BR_TZ)}–
                                {convertHHMM(h.close, p.timezone, BR_TZ)})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-foreground-muted/60">Fechado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar de contato */}
          <aside className="md:sticky md:top-20 md:self-start">
            <div className="space-y-4 rounded-2xl border border-border bg-background p-5">
              {price && (
                <div>
                  <p className="text-xs text-foreground-muted">Sessão online</p>
                  <p className="text-2xl font-semibold text-brand-dark">{price}</p>
                </div>
              )}

              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 font-medium text-white transition-colors hover:bg-[#1ebe5b]"
                >
                  <MessageCircle className="h-5 w-5" />
                  Conversar no WhatsApp
                </a>
              ) : (
                <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
                  Contato indisponível no momento.
                </p>
              )}

              {ig && (
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border font-medium text-heading transition-colors hover:bg-surface-muted"
                >
                  <InstagramIcon className="h-5 w-5" />
                  @{ig}
                </a>
              )}

              <dl className="space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-foreground-muted" />
                  <div>
                    <dt className="text-foreground-muted">Atende</dt>
                    <dd>
                      {(p.audiences ?? []).map((a) => AUDIENCE_LABELS[a as Audience]).join(", ")}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Languages className="mt-0.5 h-4 w-4 text-foreground-muted" />
                  <div>
                    <dt className="text-foreground-muted">Idiomas</dt>
                    <dd className="uppercase">{(p.languages ?? []).join(", ")}</dd>
                  </div>
                </div>
                {p.timezones.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 text-foreground-muted" />
                    <div>
                      <dt className="text-foreground-muted">Fusos atendidos</dt>
                      <dd>{p.timezones.join(", ")}</dd>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {p.accepts_online && <Badge tone="neutral">Online</Badge>}
                  {p.accepts_in_person && <Badge tone="neutral">Presencial</Badge>}
                </div>
              </dl>

              <div className="mt-4 border-t border-border pt-4">
                <ShareProfile slug={p.slug!} name={p.display_name} />
              </div>
            </div>

            <p className="mt-3 px-1 text-xs text-foreground-muted">
              A Ayumana não intermedeia sessões. O contato e o pagamento são
              combinados diretamente com o profissional.
            </p>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

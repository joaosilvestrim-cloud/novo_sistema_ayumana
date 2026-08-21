import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Markdown } from "@/components/ui/markdown";
import { Badge } from "@/components/ui/badge";
import { getQuestionBySlug } from "@/lib/forum";
import { getMyPsychologist } from "@/lib/auth";
import { COUNTRIES } from "@/lib/types";
import { AnswerForm } from "./answer-form";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

/** Texto puro a partir do Markdown, para o schema entender o conteúdo. */
function plainText(md: string | null | undefined): string {
  if (!md) return "";
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getQuestionBySlug(slug);
  if (!data) return { title: "Pergunta não encontrada" };
  const desc = plainText(data.question.body).slice(0, 155) || data.question.title;
  return {
    title: data.question.title,
    description: desc,
    alternates: { canonical: `/perguntas/${slug}` },
    openGraph: {
      title: data.question.title,
      description: desc,
      type: "article",
      url: `/perguntas/${slug}`,
    },
  };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getQuestionBySlug(slug);
  if (!data) notFound();
  const { question, answers } = data;

  const psy = await getMyPsychologist();
  const canAnswer =
    !!psy &&
    ["ideal", "presenca"].includes(psy.plan_tier) &&
    psy.verification_status === "aprovado";

  const country = COUNTRIES.find((c) => c.code === question.country_code);

  const pageUrl = `${SITE}/perguntas/${slug}`;

  // Cada resposta com autor real (especialista com CRP verificado), data e link.
  // É o que sinaliza ao Google que é conteúdo de expert, não texto qualquer.
  const answerLd = (a: (typeof answers)[number]) => ({
    "@type": "Answer",
    text: plainText(a.body).slice(0, 1500),
    url: `${pageUrl}#resposta-${a.id}`,
    dateCreated: a.created_at,
    upvoteCount: 0,
    author: {
      "@type": "Person",
      name:
        a.anonymous || !a.psychologist?.display_name
          ? "Psicólogo(a) verificado(a)"
          : a.psychologist.display_name,
      ...(!a.anonymous && a.psychologist?.slug
        ? { url: `${SITE}/psicologo/${a.psychologist.slug}` }
        : {}),
    },
  });

  const qaLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question.title,
      text: plainText(question.body) || question.title,
      answerCount: answers.length,
      dateCreated: question.published_at ?? question.created_at,
      author: { "@type": "Person", name: question.author_alias || "Anônimo" },
      ...(answers[0] ? { acceptedAnswer: answerLd(answers[0]) } : {}),
      ...(answers.length > 1 ? { suggestedAnswer: answers.slice(1).map(answerLd) } : {}),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Perguntas", item: `${SITE}/perguntas` },
      { "@type": "ListItem", position: 2, name: question.title, item: pageUrl },
    ],
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(qaLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="mx-auto max-w-2xl px-4 py-14">
        <Link href="/perguntas" className="text-sm text-foreground-muted hover:text-brand-dark">
          ← Todas as perguntas
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {question.specialty && <Badge tone="neutral">{question.specialty.name}</Badge>}
          {country && <Badge tone="brand">{country.name}</Badge>}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-heading md:text-3xl">
          {question.title}
        </h1>
        {question.body && (
          <p className="mt-4 whitespace-pre-line text-foreground-muted">{question.body}</p>
        )}
        <p className="mt-3 text-xs text-foreground-muted">
          Perguntado por {question.author_alias}
        </p>

        <hr className="my-8 border-border" />

        <h2 className="text-lg">
          {answers.length} resposta{answers.length === 1 ? "" : "s"} de profissionais
        </h2>

        <div className="mt-4 space-y-4">
          {answers.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm text-foreground-muted">
              Ainda sem respostas. Psicólogos, esta é uma chance de ajudar e
              aparecer.
            </p>
          )}
          {answers.map((a) => (
            <div key={a.id} id={`resposta-${a.id}`} className="scroll-mt-24 rounded-2xl border border-border bg-background p-5">
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                {a.anonymous || !a.psychologist ? (
                  <span className="text-sm font-semibold text-heading">
                    Psicólogo(a) anônimo(a)
                  </span>
                ) : a.psychologist.slug ? (
                  <Link
                    href={`/psicologo/${a.psychologist.slug}`}
                    className="text-sm font-semibold text-heading hover:text-brand-dark"
                  >
                    {a.psychologist.display_name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-heading">
                    {a.psychologist.display_name ?? "Profissional"}
                  </span>
                )}
                {!a.anonymous && a.psychologist?.crp_number && (
                  <span className="text-xs text-foreground-muted">
                    CRP {a.psychologist.crp_number}
                  </span>
                )}
              </div>
              <Markdown>{a.body}</Markdown>
            </div>
          ))}
        </div>

        <div className="mt-8">
          {canAnswer ? (
            <AnswerForm questionId={question.id} />
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-foreground-muted">
              É psicólogo?{" "}
              <Link href="/para-psicologos" className="font-medium text-brand-dark hover:underline">
                Assine o plano Voz
              </Link>{" "}
              para responder no fórum e aparecer para quem procura.
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

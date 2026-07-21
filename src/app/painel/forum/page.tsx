import Link from "next/link";
import { MessageCircle, Lock } from "lucide-react";
import { getMyPsychologist } from "@/lib/auth";
import { listOpenQuestions } from "@/lib/forum";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES } from "@/lib/types";

export const metadata = { title: "Fórum" };

export default async function PainelForumPage() {
  const psy = await getMyPsychologist();
  const eligible =
    !!psy &&
    ["ideal", "presenca"].includes(psy.plan_tier) &&
    psy.verification_status === "aprovado";

  if (!eligible) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl">Fórum</h1>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-6">
          <Lock className="mt-0.5 h-5 w-5 text-foreground-muted" />
          <div>
            <p className="font-medium text-heading">Recurso dos planos Voz e Presença</p>
            <p className="mt-1 text-sm text-foreground-muted">
              Responder perguntas dá visibilidade e prova de autoridade. Faça
              upgrade para participar.{" "}
              {psy?.verification_status !== "aprovado" &&
                "Seu CRP também precisa estar verificado."}
            </p>
            <Link
              href="/painel/assinatura"
              className="mt-3 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Ver planos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const questions = await listOpenQuestions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Perguntas para responder</h1>
        <p className="mt-1 text-foreground-muted">
          Responda com cuidado — suas respostas aparecem no seu perfil e atraem
          pacientes.
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-background p-10 text-center text-foreground-muted">
          Nenhuma pergunta publicada no momento.
        </p>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => {
            const country = COUNTRIES.find((c) => c.code === q.country_code);
            return (
              <li key={q.id}>
                <Link
                  href={`/perguntas/${q.slug}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 hover:shadow-md"
                >
                  <div>
                    <p className="font-medium text-heading">{q.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                      {q.specialty && <Badge tone="neutral">{q.specialty.name}</Badge>}
                      {country && <Badge tone="brand">{country.name}</Badge>}
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {q.answer_count}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-brand-dark">Responder →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

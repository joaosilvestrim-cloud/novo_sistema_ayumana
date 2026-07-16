import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { createClient } from "@/lib/supabase/server";
import { listQuestions } from "@/lib/forum";
import { Badge } from "@/components/ui/badge";
import { COUNTRIES, type Specialty } from "@/lib/types";
import { AskForm } from "./ask-form";

export const metadata = {
  title: "Perguntas e respostas",
  description:
    "Perguntas anônimas sobre saúde mental respondidas por psicólogos brasileiros verificados. Tire suas dúvidas, no Brasil ou no exterior.",
};

export default async function PerguntasPage() {
  const supabase = await createClient();
  const [{ data: specialties }, questions] = await Promise.all([
    supabase.from("specialties").select("*").order("sort_order"),
    listQuestions(),
  ]);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-14">
        <header className="mb-8">
          <h1 className="text-4xl font-semibold text-heading">Perguntas & respostas</h1>
          <p className="mt-2 text-foreground-muted">
            Dúvidas reais respondidas por psicólogos verificados. Anônimo e
            moderado.
          </p>
        </header>

        <div className="mb-10">
          <AskForm specialties={(specialties as Specialty[]) ?? []} />
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">
            Ainda não há perguntas publicadas. Seja o primeiro a perguntar!
          </div>
        ) : (
          <ul className="space-y-3">
            {questions.map((q) => {
              const country = COUNTRIES.find((c) => c.code === q.country_code);
              return (
                <li key={q.id}>
                  <Link
                    href={`/perguntas/${q.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <h2 className="font-medium text-heading group-hover:text-brand-dark">
                        {q.title}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                        {q.specialty && <Badge tone="neutral">{q.specialty.name}</Badge>}
                        {country && <Badge tone="brand">{country.name}</Badge>}
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {q.answer_count} resposta(s)
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-foreground-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}

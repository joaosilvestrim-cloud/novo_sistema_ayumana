import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { moderateQuestionAction, moderateAnswerAction } from "./actions";

export const metadata = { title: "Moderação" };

type PendingQuestion = {
  id: string;
  title: string;
  body: string | null;
  author_alias: string;
  created_at: string;
};

type PendingAnswer = {
  id: string;
  body: string;
  created_at: string;
  question_id: string;
  question: { title: string; body: string | null } | null;
  psychologist: { display_name: string | null; crp_number: string | null } | null;
};

type ContextAnswer = {
  id: string;
  body: string;
  question_id: string;
  psychologist: { display_name: string | null; crp_number: string | null } | null;
};

function Decision({
  action,
  id,
}: {
  action: (fd: FormData) => void;
  id: string;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="aprovar" />
        <button className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          Aprovar
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="reprovar" />
        <button className="h-9 rounded-lg border border-danger px-3 text-sm font-medium text-danger hover:bg-danger/10">
          Reprovar
        </button>
      </form>
    </div>
  );
}

export default async function ModeracaoPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: questions }, { data: answers }] = await Promise.all([
    admin
      .from("forum_questions")
      .select("id, title, body, author_alias, created_at")
      .eq("status", "pendente")
      .order("created_at", { ascending: true }),
    admin
      .from("forum_answers")
      .select(
        "id, body, created_at, question_id, question:forum_questions(title, body), psychologist:psychologists(display_name, crp_number)"
      )
      .eq("status", "pendente")
      .order("created_at", { ascending: true }),
  ]);

  const q = (questions as PendingQuestion[]) ?? [];
  const a = (answers as unknown as PendingAnswer[]) ?? [];

  // Contexto: respostas JÁ publicadas nas mesmas perguntas das respostas pendentes.
  const questionIds = [...new Set(a.map((x) => x.question_id).filter(Boolean))];
  let contextoPorPergunta = new Map<string, ContextAnswer[]>();
  if (questionIds.length) {
    const { data: pubs } = await admin
      .from("forum_answers")
      .select("id, body, question_id, psychologist:psychologists(display_name, crp_number)")
      .in("question_id", questionIds)
      .eq("status", "publicada")
      .order("created_at", { ascending: true });
    const lista = (pubs as unknown as ContextAnswer[]) ?? [];
    contextoPorPergunta = lista.reduce((map, ans) => {
      const arr = map.get(ans.question_id) ?? [];
      arr.push(ans);
      map.set(ans.question_id, arr);
      return map;
    }, new Map<string, ContextAnswer[]>());
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl">Moderação do fórum</h1>
        <p className="mt-1 text-foreground-muted">
          Aprove perguntas e respostas antes de publicá-las.
        </p>
      </div>

      {/* Perguntas pendentes */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg">Perguntas</h2>
          <Badge tone="warning">{q.length}</Badge>
        </div>
        {q.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-foreground-muted">
            Nenhuma pergunta pendente.
          </p>
        ) : (
          <ul className="space-y-3">
            {q.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background p-5">
                <div className="min-w-0">
                  <p className="font-medium text-heading">{item.title}</p>
                  {item.body && (
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground-muted">{item.body}</p>
                  )}
                  <p className="mt-2 text-xs text-foreground-muted">por {item.author_alias}</p>
                </div>
                <Decision action={moderateQuestionAction} id={item.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Respostas pendentes */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg">Respostas</h2>
          <Badge tone="warning">{a.length}</Badge>
        </div>
        {a.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-foreground-muted">
            Nenhuma resposta pendente.
          </p>
        ) : (
          <ul className="space-y-4">
            {a.map((item) => {
              const contexto = contextoPorPergunta.get(item.question_id) ?? [];
              return (
                <li key={item.id} className="rounded-2xl border border-border bg-background p-5">
                  {/* Pergunta, para dar contexto */}
                  <div className="rounded-xl bg-surface-muted/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Pergunta</p>
                    <p className="mt-1 font-medium text-heading">{item.question?.title}</p>
                    {item.question?.body && <p className="mt-1 whitespace-pre-line text-sm text-foreground-muted">{item.question.body}</p>}
                  </div>

                  {/* Respostas já publicadas, para o moderador comparar */}
                  {contexto.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-foreground-muted">Já publicadas nesta pergunta ({contexto.length}):</p>
                      <ul className="mt-1 space-y-2">
                        {contexto.map((ca) => (
                          <li key={ca.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                            <p className="whitespace-pre-line text-foreground">{ca.body}</p>
                            <p className="mt-1 text-xs text-foreground-muted">
                              {ca.psychologist?.display_name}
                              {ca.psychologist?.crp_number ? ` · CRP ${ca.psychologist.crp_number}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* A resposta em análise */}
                  <div className="mt-3 rounded-xl border-2 border-brand/40 bg-brand/5 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-dark">Resposta para aprovar</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground">{item.body}</p>
                    <p className="mt-2 text-xs text-foreground-muted">
                      {item.psychologist?.display_name}
                      {item.psychologist?.crp_number ? ` · CRP ${item.psychologist.crp_number}` : ""}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Decision action={moderateAnswerAction} id={item.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

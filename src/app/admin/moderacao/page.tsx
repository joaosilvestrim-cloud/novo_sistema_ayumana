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
  question: { title: string } | null;
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
        "id, body, created_at, question:forum_questions(title), psychologist:psychologists(display_name, crp_number)"
      )
      .eq("status", "pendente")
      .order("created_at", { ascending: true }),
  ]);

  const q = (questions as PendingQuestion[]) ?? [];
  const a = (answers as unknown as PendingAnswer[]) ?? [];

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
                    <p className="mt-1 line-clamp-3 text-sm text-foreground-muted">{item.body}</p>
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
          <ul className="space-y-3">
            {a.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background p-5">
                <div className="min-w-0">
                  <p className="text-xs text-foreground-muted">
                    Em: <span className="font-medium text-heading">{item.question?.title}</span>
                  </p>
                  <p className="mt-1 text-sm text-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-foreground-muted">
                    {item.psychologist?.display_name}
                    {item.psychologist?.crp_number ? ` · CRP ${item.psychologist.crp_number}` : ""}
                  </p>
                </div>
                <Decision action={moderateAnswerAction} id={item.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

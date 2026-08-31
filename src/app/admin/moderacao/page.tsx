import Link from "next/link";
import { MessageSquare, Check, X, AlertCircle, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { moderateQuestionAction, moderateAnswerAction } from "./actions";

export const metadata = { title: "Moderação" };

type Status = "pendente" | "publicada" | "reprovada";
type Question = { id: string; title: string; body: string | null; author_alias: string; status: Status; created_at: string };
type Answer = {
  id: string; body: string; status: Status; created_at: string; question_id: string;
  psychologist: { display_name: string | null; crp_number: string | null; slug: string | null } | null;
};

const TONE: Record<Status, "warning" | "success" | "danger"> = { pendente: "warning", publicada: "success", reprovada: "danger" };
const LABEL: Record<Status, string> = { pendente: "Pendente", publicada: "Publicada", reprovada: "Reprovada" };

/** Botões de decisão conforme o status atual. */
function ModActions({ action, id, status }: { action: (fd: FormData) => void; id: string; status: Status }) {
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {status !== "publicada" && (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="aprovar" />
          <button className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary-hover">
            <Check className="h-3.5 w-3.5" /> {status === "reprovada" ? "Aprovar" : "Aprovar"}
          </button>
        </form>
      )}
      {status !== "reprovada" && (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="reprovar" />
          <button className="inline-flex h-8 items-center gap-1 rounded-lg border border-danger px-3 text-xs font-medium text-danger hover:bg-danger/10">
            <X className="h-3.5 w-3.5" /> {status === "publicada" ? "Despublicar" : "Reprovar"}
          </button>
        </form>
      )}
    </div>
  );
}

export default async function ModeracaoPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [{ data: qData }, { data: aData }] = await Promise.all([
    admin.from("forum_questions").select("id, title, body, author_alias, status, created_at").order("created_at", { ascending: false }),
    admin.from("forum_answers").select("id, body, status, created_at, question_id, psychologist:psychologists(display_name, crp_number, slug)").order("created_at", { ascending: true }),
  ]);
  const questions = (qData as Question[] | null) ?? [];
  const answers = (aData as unknown as Answer[] | null) ?? [];

  const porPergunta = new Map<string, Answer[]>();
  for (const a of answers) {
    const arr = porPergunta.get(a.question_id) ?? [];
    arr.push(a);
    porPergunta.set(a.question_id, arr);
  }

  // Métricas de topo.
  const totalPerg = questions.length;
  const totalResp = answers.length;
  const respondidas = new Set(answers.filter((a) => a.status === "publicada").map((a) => a.question_id)).size;
  const semResposta = questions.filter((q) => !(porPergunta.get(q.id) ?? []).some((a) => a.status === "publicada")).length;
  const pendPerg = questions.filter((q) => q.status === "pendente").length;
  const pendResp = answers.filter((a) => a.status === "pendente").length;

  // Ordena: quem tem algo pendente primeiro, depois sem resposta, depois o resto.
  const ordenadas = [...questions].sort((qa, qb) => {
    const rank = (q: Question) => {
      const ans = porPergunta.get(q.id) ?? [];
      if (q.status === "pendente" || ans.some((a) => a.status === "pendente")) return 0;
      if (!ans.some((a) => a.status === "publicada")) return 1;
      return 2;
    };
    return rank(qa) - rank(qb);
  });

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl"><MessageSquare className="h-6 w-6 text-brand-dark" /> Fórum e moderação</h1>
        <p className="mt-1 text-foreground-muted">Todas as perguntas do site, com as respostas e quem respondeu. Aprove, reprove ou despublique aqui.</p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Perguntas", value: totalPerg },
          { label: "Respondidas", value: respondidas, sub: `${totalPerg ? Math.round((respondidas / totalPerg) * 100) : 0}%` },
          { label: "Sem resposta", value: semResposta, alerta: semResposta > 0 },
          { label: "Perguntas pendentes", value: pendPerg, alerta: pendPerg > 0 },
          { label: "Respostas pendentes", value: pendResp, alerta: pendResp > 0 },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border bg-background p-4 ${s.alerta ? "border-yellow-300" : "border-border"}`}>
            <p className={`text-2xl font-semibold ${s.alerta ? "text-yellow-700" : "text-heading"}`}>{s.value}</p>
            <p className="text-xs text-foreground-muted">{s.label}{s.sub ? ` · ${s.sub}` : ""}</p>
          </div>
        ))}
      </div>

      {/* Lista de perguntas */}
      <div className="space-y-4">
        {ordenadas.map((q) => {
          const ans = porPergunta.get(q.id) ?? [];
          const publicadas = ans.filter((a) => a.status === "publicada");
          const semResp = publicadas.length === 0;
          return (
            <section key={q.id} className={`rounded-2xl border bg-background p-5 ${q.status === "pendente" || ans.some((a) => a.status === "pendente") ? "border-yellow-300" : "border-border"}`}>
              {/* Pergunta */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-heading">{q.title}</h2>
                    <Badge tone={TONE[q.status]}>{LABEL[q.status]}</Badge>
                  </div>
                  {q.body && <p className="mt-1 whitespace-pre-line text-sm text-foreground-muted">{q.body}</p>}
                  <p className="mt-1 text-xs text-foreground-muted">por {q.author_alias} · {fmt(q.created_at)}</p>
                </div>
                <ModActions action={moderateQuestionAction} id={q.id} status={q.status} />
              </div>

              {/* Respostas */}
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {ans.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-yellow-700"><AlertCircle className="h-4 w-4" /> Nenhuma resposta ainda. Boa candidata para pedir a um psicólogo do plano Voz.</p>
                ) : (
                  ans.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border p-3">
                      <div className="min-w-0">
                        <p className="whitespace-pre-line text-sm text-foreground">{a.body}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                          <Badge tone={TONE[a.status]}>{LABEL[a.status]}</Badge>
                          {a.psychologist?.slug ? (
                            <Link href={`/psicologo/${a.psychologist.slug}`} target="_blank" className="inline-flex items-center gap-1 font-medium text-brand-dark hover:underline">
                              {a.psychologist.display_name} <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="font-medium text-heading">{a.psychologist?.display_name ?? "Psicólogo"}</span>
                          )}
                          {a.psychologist?.crp_number ? `· CRP ${a.psychologist.crp_number}` : ""}
                          {" · "}{fmt(a.created_at)}
                        </p>
                      </div>
                      <ModActions action={moderateAnswerAction} id={a.id} status={a.status} />
                    </div>
                  ))
                )}
                {!semResp && ans.some((a) => a.status === "pendente") && (
                  <p className="text-xs text-yellow-700">Há resposta(s) pendente(s) nesta pergunta.</p>
                )}
              </div>
            </section>
          );
        })}
        {ordenadas.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">Nenhuma pergunta no fórum ainda.</p>
        )}
      </div>
    </div>
  );
}

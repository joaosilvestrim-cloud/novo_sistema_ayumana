import { createClient } from "@/lib/supabase/server";
import type { ForumQuestion } from "@/lib/types";

export type QuestionWithMeta = ForumQuestion & {
  specialty: { name: string; slug: string } | null;
  answer_count: number;
};

export type AnswerWithAuthor = {
  id: string;
  body: string;
  created_at: string;
  anonymous: boolean;
  psychologist: {
    slug: string | null;
    display_name: string | null;
    crp_number: string | null;
  } | null;
};

export async function listQuestions(limit = 50): Promise<QuestionWithMeta[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_questions")
    .select(
      "*, specialty:specialties(name,slug), answers:forum_answers(count)"
    )
    .eq("status", "publicada")
    .order("published_at", { ascending: false })
    .limit(limit);

  return ((data as unknown[]) ?? []).map((row) => {
    const r = row as ForumQuestion & {
      specialty: { name: string; slug: string } | null;
      answers: { count: number }[];
    };
    return {
      ...r,
      specialty: r.specialty ?? null,
      answer_count: r.answers?.[0]?.count ?? 0,
    };
  });
}

export async function getQuestionBySlug(slug: string): Promise<{
  question: QuestionWithMeta;
  answers: AnswerWithAuthor[];
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_questions")
    .select("*, specialty:specialties(name,slug)")
    .eq("slug", slug)
    .eq("status", "publicada")
    .maybeSingle();
  if (!data) return null;

  const q = data as ForumQuestion & {
    specialty: { name: string; slug: string } | null;
  };

  const { data: ans } = await supabase
    .from("forum_answers")
    .select(
      "*, psychologist:psychologists(slug, display_name, crp_number)"
    )
    .eq("question_id", q.id)
    .eq("status", "publicada")
    .order("created_at", { ascending: true });

  const answers: AnswerWithAuthor[] = ((ans as unknown[]) ?? []).map((a) => {
    const row = a as {
      id: string;
      body: string;
      created_at: string;
      anonymous?: boolean;
      psychologist:
        | { slug: string | null; display_name: string | null; crp_number: string | null }
        | { slug: string | null; display_name: string | null; crp_number: string | null }[]
        | null;
    };
    const psy = Array.isArray(row.psychologist)
      ? row.psychologist[0] ?? null
      : row.psychologist;
    return {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      anonymous: !!row.anonymous,
      psychologist: psy,
    };
  });

  return {
    question: { ...q, specialty: q.specialty ?? null, answer_count: answers.length },
    answers,
  };
}

/** Perguntas publicadas para o psicólogo responder (painel). */
export async function listOpenQuestions(limit = 50): Promise<QuestionWithMeta[]> {
  return listQuestions(limit);
}

export type PsychologistAnswer = {
  id: string;
  body: string;
  created_at: string;
  question: { slug: string; title: string };
};

/** Respostas publicadas e identificadas (não anônimas) deste psicólogo. */
export async function listAnswersByPsychologist(
  psychologistId: string,
  limit = 4
): Promise<PsychologistAnswer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forum_answers")
    .select("id, body, created_at, question:forum_questions(slug, title, status)")
    .eq("psychologist_id", psychologistId)
    .eq("status", "publicada")
    .eq("anonymous", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as unknown[]) ?? [])
    .map((row) => {
      const r = row as {
        id: string;
        body: string;
        created_at: string;
        question:
          | { slug: string; title: string; status: string }
          | { slug: string; title: string; status: string }[]
          | null;
      };
      const q = Array.isArray(r.question) ? r.question[0] ?? null : r.question;
      if (!q || q.status !== "publicada") return null;
      return { id: r.id, body: r.body, created_at: r.created_at, question: { slug: q.slug, title: q.title } };
    })
    .filter(Boolean) as PsychologistAnswer[];
}

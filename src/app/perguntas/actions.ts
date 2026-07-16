"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export type AskState = { error: string | null; ok?: boolean };

export async function askQuestionAction(
  _prev: AskState,
  formData: FormData
): Promise<AskState> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const alias = String(formData.get("author_alias") ?? "").trim() || "Anônimo";
  const country = String(formData.get("country_code") ?? "").trim() || null;
  const specialtyRaw = String(formData.get("specialty_id") ?? "").trim();
  const specialtyId = specialtyRaw ? Number(specialtyRaw) : null;

  if (title.length < 10) {
    return { error: "Escreva um título com pelo menos 10 caracteres." };
  }

  const supabase = await createClient();
  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  const { error } = await supabase.from("forum_questions").insert({
    title,
    body: body || null,
    author_alias: alias,
    country_code: country,
    specialty_id: Number.isInteger(specialtyId) ? specialtyId : null,
    status: "pendente",
    slug,
  });

  if (error) return { error: `Não foi possível enviar: ${error.message}` };

  revalidatePath("/perguntas");
  return { error: null, ok: true };
}

export type AnswerState = { error: string | null; ok?: boolean };

export async function answerQuestionAction(
  _prev: AnswerState,
  formData: FormData
): Promise<AnswerState> {
  const questionId = String(formData.get("question_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!questionId || body.length < 20) {
    return { error: "Sua resposta precisa ter ao menos 20 caracteres." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Faça login para responder." };

  const { data: psy } = await supabase
    .from("psychologists")
    .select("id, plan_tier, verification_status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!psy) return { error: "Complete seu perfil de psicólogo antes de responder." };
  if (!["ideal", "presenca"].includes(psy.plan_tier)) {
    return { error: "Responder no fórum é um recurso dos planos Ideal e Presença." };
  }
  if (psy.verification_status !== "aprovado") {
    return { error: "Seu CRP precisa estar verificado para responder." };
  }

  const { error } = await supabase.from("forum_answers").insert({
    question_id: questionId,
    psychologist_id: psy.id,
    body,
    status: "pendente",
  });
  if (error) return { error: `Não foi possível enviar: ${error.message}` };

  revalidatePath("/perguntas");
  return { error: null, ok: true };
}

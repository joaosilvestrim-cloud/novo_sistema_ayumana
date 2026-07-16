"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { answerQuestionAction, type AnswerState } from "../actions";

const initial: AnswerState = { error: null };

export function AnswerForm({ questionId }: { questionId: string }) {
  const [state, action] = useActionState(answerQuestionAction, initial);

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-700">
        <CheckCircle2 className="h-5 w-5" />
        Resposta enviada! Ela aparece após a moderação.
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-background p-5">
      <input type="hidden" name="question_id" value={questionId} />
      <h3 className="text-base font-semibold text-heading">Responder como profissional</h3>
      <Textarea name="body" rows={5} placeholder="Escreva uma resposta acolhedora e responsável. Evite diagnósticos." required />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <SubmitButton>Enviar resposta</SubmitButton>
    </form>
  );
}

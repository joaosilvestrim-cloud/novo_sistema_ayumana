"use client";

import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier } from "@/lib/types";

const TIERS: PlanTier[] = ["essencial", "destaque", "ideal", "presenca"];

/** Troca o plano do psicólogo direto na lista (auto-submit ao mudar). */
export function PlanSelect({
  psyId,
  current,
  action,
}: {
  psyId: string;
  current: PlanTier | null;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="psy_id" value={psyId} />
      <select
        name="plan"
        defaultValue={current ?? "essencial"}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs"
        title="Trocar plano"
      >
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {PLAN_LABEL[t]}
          </option>
        ))}
      </select>
    </form>
  );
}

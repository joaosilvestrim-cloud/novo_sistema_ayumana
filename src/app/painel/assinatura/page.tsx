import { Check } from "lucide-react";
import { getMyPsychologist } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/types";
import { selectPlanAction } from "./actions";

export const metadata = { title: "Assinatura" };

export default async function AssinaturaPage() {
  const psy = await getMyPsychologist();
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").order("sort_order");
  const plans = (data as Plan[]) ?? [];
  const current = psy?.plan_tier ?? "essencial";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Assinatura</h1>
        <p className="mt-1 text-foreground-muted">
          Escolha seu plano. A cobrança recorrente entra na próxima fase — por
          enquanto a troca é imediata e gratuita.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const active = plan.id === current;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 ${
                active ? "border-brand ring-2 ring-brand/20" : "border-border"
              } bg-background`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg">{plan.name}</h2>
                {active && <Badge tone="success">Plano atual</Badge>}
              </div>
              <p className="mt-1 text-2xl font-semibold text-brand-dark">
                {plan.price_label}
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    {f}
                  </li>
                ))}
              </ul>

              {!plan.is_selfservice ? (
                <p className="mt-5 rounded-lg bg-surface-muted px-3 py-2 text-xs text-foreground-muted">
                  Plano Presença tem onboarding humano e lista de espera. Fale com
                  a equipe.
                </p>
              ) : active ? (
                <button
                  disabled
                  className="mt-5 h-10 w-full rounded-lg border border-border text-sm text-foreground-muted"
                >
                  Selecionado
                </button>
              ) : (
                <form action={selectPlanAction} className="mt-5">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
                    Escolher {plan.name}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

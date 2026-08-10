import { getMyPsychologist } from "@/lib/auth";
import { effectivePlan } from "@/lib/plan-features";
import { HelpCenter } from "@/components/painel/help-center";
import type { PlanTier } from "@/lib/types";

export const metadata = { title: "Ajuda e planos" };

export default async function AjudaPage() {
  const psy = await getMyPsychologist();
  const plano: PlanTier = psy
    ? effectivePlan({
        plan_tier: psy.plan_tier,
        trial_tier: psy.trial_tier,
        trial_ends_at: psy.trial_ends_at,
      })
    : "essencial";

  const whatsapp = process.env.SUPPORT_WHATSAPP || "5511981559500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Ajuda e planos</h1>
        <p className="mt-1 text-foreground-muted">
          Entenda o que cada plano traz e como assinar. Clique em um plano para ver os detalhes.
        </p>
      </div>
      <HelpCenter currentPlan={plano} supportWhatsapp={whatsapp} />
    </div>
  );
}

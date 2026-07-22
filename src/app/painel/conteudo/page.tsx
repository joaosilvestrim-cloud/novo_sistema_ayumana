import Link from "next/link";
import { redirect } from "next/navigation";
import { Palette, Lock } from "lucide-react";
import { getProfile, getMyPsychologist } from "@/lib/auth";
import { listItemsDetailed, listCycles, currentCycle, cycleLabel } from "@/lib/studio";
import { effectivePlan } from "@/lib/plan-features";
import { PLAN_LABEL } from "@/lib/plan-labels";
import { PsyContent } from "@/components/studio/psy-content";

export const metadata = { title: "Meu conteúdo" };

export default async function MeuConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{ cycle?: string }>;
}) {
  const perfil = await getProfile();
  if (!perfil) redirect("/login");

  const psy = await getMyPsychologist();
  if (!psy) redirect("/painel/onboarding");

  // O Estúdio é entregável do plano Presença.
  const plano = effectivePlan({
    plan_tier: psy.plan_tier,
    trial_tier: psy.trial_tier,
    trial_ends_at: psy.trial_ends_at,
  });

  if (plano !== "presenca") {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
        <Palette className="mx-auto h-10 w-10 text-brand-dark" />
        <h1 className="mt-3 text-xl">Estúdio de conteúdo</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
          No plano <strong>{PLAN_LABEL.presenca}</strong> nossa equipe cria as artes do seu
          Instagram todo mês. Você acompanha por aqui, aprova e baixa tudo pronto.
        </p>
        <p className="mt-2 text-sm text-foreground-muted">
          Seu plano hoje é <strong>{PLAN_LABEL[plano]}</strong>.
        </p>
        <Link
          href="/painel/assinatura"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Lock className="h-4 w-4" /> Conhecer o {PLAN_LABEL.presenca}
        </Link>
      </div>
    );
  }

  const sp = await searchParams;
  const cycles = await listCycles(psy.id);
  const cycle = sp.cycle && cycles.includes(sp.cycle) ? sp.cycle : currentCycle();
  const items = await listItemsDetailed(psy.id, cycle);

  return (
    <div className="space-y-5">
      <PsyContent items={items} mes={cycleLabel(cycle)} />

      {cycles.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-sm text-foreground-muted">Ver outro mês:</span>
          {cycles.map((c) => (
            <Link
              key={c}
              href={`/painel/conteudo?cycle=${c}`}
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                c === cycle
                  ? "bg-brand text-white"
                  : "border border-border text-foreground-muted hover:bg-surface-muted"
              }`}
            >
              {cycleLabel(c)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

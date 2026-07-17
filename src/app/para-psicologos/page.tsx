import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/site/page-shell";
import { ComparePlans } from "@/components/site/compare-plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/types";

export const metadata = {
  title: "Para psicólogos",
  description:
    "Apareça para brasileiros que procuram terapia em português, no Brasil e no exterior. Comece grátis.",
};

// Fallback caso o banco ainda não tenha os planos populados.
const FALLBACK: Plan[] = [
  { id: "essencial", name: "Essencial", price_cents: 0, price_label: "Grátis", search_priority: 0, is_selfservice: true, sort_order: 1, features: ["Perfil completo", "Verificação de CRP", "Contato via WhatsApp", "Aparece na busca"] },
  { id: "destaque", name: "Destaque", price_cents: 2490, price_label: "R$ 24,90/mês", search_priority: 10, is_selfservice: true, sort_order: 2, features: ["Prioridade na busca", "Exibição do valor da sessão", "Indicador de agenda aberta", "Campos extras no perfil"] },
  { id: "ideal", name: "Ideal", price_cents: 3990, price_label: "R$ 39,90/mês", search_priority: 20, is_selfservice: true, sort_order: 3, features: ["Prioridade máxima", "Vídeo de apresentação", "Selo exterior em destaque", "Participação no fórum"] },
  { id: "presenca", name: "Presença", price_cents: 29700, price_label: "R$ 297 a 397/mês", search_priority: 30, is_selfservice: false, sort_order: 4, features: ["Tudo do Ideal", "Presença digital gerida pela Ayumana", "8 peças/mês + 1 revisão", "Vagas limitadas (15 a 20)"] },
];

export default async function ParaPsicologosPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("*").order("sort_order");
  const plans = data && data.length ? (data as Plan[]) : FALLBACK;

  return (
    <PageShell>
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold text-heading">
            Apareça para quem procura por você
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-foreground-muted">
            A Ayumana conecta psicólogos brasileiros a pacientes no Brasil e no
            exterior. Sem comissão sobre suas sessões — o contato é direto, no seu
            WhatsApp.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/cadastro" size="lg">
              Criar meu perfil grátis
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const featured = plan.id === "ideal";
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-2xl border bg-background p-6 ${
                  featured ? "border-brand ring-2 ring-brand/20" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg">{plan.name}</h2>
                  {featured && <Badge tone="success">Popular</Badge>}
                </div>
                <p className="mt-2 text-2xl font-semibold text-brand-dark">
                  {plan.price_label}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  href="/cadastro"
                  variant={featured ? "primary" : "outline"}
                  className="mt-6 w-full"
                >
                  {plan.is_selfservice ? "Começar" : "Entrar na lista"}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-sm text-foreground-muted">
          Cobrança mensal, sem fidelidade, cancele quando quiser. Preços iniciais,
          sujeitos a ajuste.
        </p>
      </section>

      <div className="border-t border-border bg-surface">
        <ComparePlans />
      </div>
    </PageShell>
  );
}

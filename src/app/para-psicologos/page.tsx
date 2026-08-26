import { createClient } from "@/lib/supabase/server";
import { PageShell } from "@/components/site/page-shell";
import { HelpCenter } from "@/components/painel/help-center";
import { PresencaWaitlist } from "@/components/presenca-waitlist";
import { Button } from "@/components/ui/button";
import type { PlanTier } from "@/lib/types";

export const metadata = {
  title: "Para psicólogos",
  description:
    "Apareça para brasileiros que procuram terapia em português, no Brasil e no exterior. Comece grátis.",
};

export default async function ParaPsicologosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const whatsapp = process.env.SUPPORT_WHATSAPP || "5511930662105";

  // Preços do banco (o editor de preços do admin manda no valor exibido aqui).
  const { data: planos } = await supabase.from("plans").select("id, price_cents");
  const precos = Object.fromEntries(
    (planos ?? []).map((p) => [p.id, p.price_cents as number])
  ) as Partial<Record<PlanTier, number>>;

  return (
    <PageShell>
      <section className="bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-4xl font-semibold text-heading">
            Apareça para quem procura por você
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-foreground-muted">
            A Ayumana conecta psicólogos brasileiros a pacientes no Brasil e no
            exterior. Sem comissão sobre suas sessões, o contato é direto, no seu
            WhatsApp.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/cadastro" size="lg">
              Criar meu perfil grátis
            </Button>
          </div>
        </div>
      </section>

      {/* Planos: seletor interativo (mensal/anual, detalhe e passo a passo) */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-heading">
            Explore os planos e veja como assinar
          </h2>
          <p className="mt-3 text-lg font-medium text-brand-dark">
            Crie raiz. Ganhe alcance. Tenha voz. Construa presença.
          </p>
          <p className="mt-2 text-foreground-muted">
            Clique em um plano para ver tudo que ele traz e o passo a passo para começar.
          </p>
        </div>
        <div className="mt-10">
          <HelpCenter mode="publico" supportWhatsapp={whatsapp} precos={precos} />
        </div>
        <p className="mt-8 text-center text-sm text-foreground-muted">
          Cobrança mensal, sem fidelidade, cancele quando quiser. Preços iniciais,
          sujeitos a ajuste.
        </p>
      </section>

      {/* Fila do Presença */}
      <div id="fila-presenca" className="border-t border-border bg-surface">
        <section className="mx-auto max-w-2xl px-4 py-16">
          <PresencaWaitlist logado={!!user} />
        </section>
      </div>
    </PageShell>
  );
}

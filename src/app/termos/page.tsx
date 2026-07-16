import { PageShell } from "@/components/site/page-shell";

export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl">Termos de Uso</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Rascunho inicial — a versão jurídica final será revisada antes do
          lançamento.
        </p>
        <div className="mt-8 space-y-4 text-foreground-muted">
          <p>
            A Ayumana disponibiliza uma vitrine de profissionais de psicologia. A
            plataforma não presta serviço de psicoterapia nem se responsabiliza
            pelo atendimento, que é acordado diretamente entre paciente e
            profissional.
          </p>
          <p>
            Todo psicólogo listado passa por verificação de CRP junto ao Cadastro
            Nacional de Psicólogos antes de ter o perfil publicado.
          </p>
          <p>
            Em situações de crise, procure atendimento imediato ou ligue para o
            CVV 188.
          </p>
        </div>
      </article>
    </PageShell>
  );
}

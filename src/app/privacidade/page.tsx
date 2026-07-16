import { PageShell } from "@/components/site/page-shell";

export const metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-2xl px-4 py-16 prose-ayumana">
        <h1 className="text-3xl">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Rascunho inicial — a versão jurídica final será revisada antes do
          lançamento (LGPD).
        </p>
        <div className="mt-8 space-y-4 text-foreground-muted">
          <p>
            A Ayumana é uma vitrine que conecta pacientes a psicólogos. Não
            guardamos prontuário nem dado clínico. Coletamos apenas os dados
            necessários para operar a plataforma.
          </p>
          <p>
            <strong className="text-heading">Psicólogos:</strong> dados de
            cadastro, CRP e documento de verificação (armazenados de forma
            privada, acessíveis apenas à equipe de verificação).
          </p>
          <p>
            <strong className="text-heading">Pacientes:</strong> a busca é
            pública e o contato acontece diretamente pelo WhatsApp do
            profissional — a Ayumana não intermedeia as conversas.
          </p>
          <p>
            Para exercer seus direitos de titular de dados, entre em contato pelo
            e-mail informado no rodapé.
          </p>
        </div>
      </article>
    </PageShell>
  );
}

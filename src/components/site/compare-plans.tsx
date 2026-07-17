import { Fragment } from "react";
import { Check, X } from "lucide-react";

const PLANS = ["Essencial", "Destaque", "Ideal", "Presença"] as const;

// valores por plano: [Essencial, Destaque, Ideal, Presença]
const GROUPS: { title: string; rows: { label: string; v: boolean[] }[] }[] = [
  {
    title: "Presença na plataforma",
    rows: [
      { label: "Perfil completo (foto, cidade, WhatsApp, e-mail e Instagram)", v: [true, true, true, true] },
      { label: "Verificação de CRP e selo de conta verificada", v: [true, true, true, true] },
      { label: "Contato direto pelo WhatsApp, sem intermediação", v: [true, true, true, true] },
      { label: "Aparece na busca do catálogo", v: [true, true, true, true] },
      { label: "Abordagens, especialidades e formação no perfil", v: [true, true, true, true] },
      { label: "Atende no exterior, com filtro por país e fuso horário", v: [true, true, true, true] },
    ],
  },
  {
    title: "Mais visibilidade",
    rows: [
      { label: "Exibição do valor da sessão", v: [false, true, true, true] },
      { label: "Indicador de agenda aberta", v: [false, true, true, true] },
      { label: "Prioridade na busca", v: [false, true, true, true] },
      { label: "Prioridade máxima na busca", v: [false, false, true, true] },
      { label: "Vídeo de apresentação no perfil", v: [false, false, true, true] },
      { label: "Selo de atendimento no exterior em destaque", v: [false, false, true, true] },
      { label: "Responder no fórum e ganhar autoridade", v: [false, false, true, true] },
    ],
  },
  {
    title: "Presença digital gerida",
    rows: [
      { label: "Conteúdo produzido pela Ayumana (8 peças por mês + 1 revisão)", v: [false, false, false, true] },
      { label: "Onboarding humano e vaga garantida (capacidade limitada)", v: [false, false, false, true] },
    ],
  },
];

function Cell({ on }: { on: boolean }) {
  return (
    <td className="px-3 py-4 text-center">
      {on ? (
        <Check className="mx-auto h-5 w-5 text-green-600" />
      ) : (
        <X className="mx-auto h-4 w-4 text-neutral-300" />
      )}
    </td>
  );
}

export function ComparePlans() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold text-heading">Compare os planos</h2>
        <p className="mt-3 text-foreground-muted">
          Todos dão acesso à plataforma. Os pagos aumentam sua visibilidade e o
          alcance do seu perfil.
        </p>
      </div>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="w-1/2 px-4 py-4 text-left font-medium text-heading">
                Planos profissionais
              </th>
              {PLANS.map((p) => (
                <th key={p} className="px-3 py-4 text-center">
                  <span
                    className={
                      p === "Ideal"
                        ? "inline-block rounded-full bg-brand/15 px-3 py-1 text-sm font-semibold text-brand-dark"
                        : "text-sm font-semibold text-heading"
                    }
                  >
                    {p}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => (
              <Fragment key={g.title}>
                <tr className="bg-surface">
                  <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                    {g.title}
                  </td>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-border last:border-0">
                    <td className="px-4 py-4 text-foreground">{r.label}</td>
                    {r.v.map((on, i) => (
                      <Cell key={i} on={on} />
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-center text-xs text-foreground-muted">
        Você começa no Essencial grátis e muda de plano quando quiser, sem
        fidelidade.
      </p>
    </section>
  );
}

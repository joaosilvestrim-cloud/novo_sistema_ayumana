import { Fragment } from "react";
import { Check, X } from "lucide-react";

const PLANS = ["Raiz", "Alcance", "Voz", "Presença"] as const;
const POPULAR = "Voz";

// valores por plano: [Raiz, Alcance, Voz, Presença]
const GROUPS: { title: string; rows: { label: string; desc: string; v: boolean[] }[] }[] = [
  {
    title: "Presença na plataforma",
    rows: [
      { label: "Perfil completo", desc: "Foto, cidade, WhatsApp, e-mail e Instagram no seu perfil público.", v: [true, true, true, true] },
      { label: "Verificação de CRP e selo verificado", desc: "Conferimos seu registro e você ganha o selo de conta verificada.", v: [true, true, true, true] },
      { label: "Contato direto pelo WhatsApp", desc: "O paciente fala com você direto, sem comissão sobre a sessão.", v: [true, true, true, true] },
      { label: "Aparece na busca do catálogo", desc: "Seu perfil entra no catálogo e é encontrado por queixa, abordagem e fuso.", v: [true, true, true, true] },
      { label: "Abordagens, especialidades e formação", desc: "Campos completos para o paciente entender o seu trabalho.", v: [true, true, true, true] },
      { label: "Atende no exterior", desc: "Marque os países que atende e apareça no filtro por país e fuso horário.", v: [true, true, true, true] },
    ],
  },
  {
    title: "Mais visibilidade",
    rows: [
      { label: "Exibição do valor da sessão", desc: "Mostra o preço (online e presencial) no seu perfil.", v: [false, true, true, true] },
      { label: "Indicador de agenda aberta", desc: "Selo “aceitando novos pacientes” no perfil e na busca.", v: [false, true, true, true] },
      { label: "Prioridade na busca", desc: "Seu perfil aparece acima dos gratuitos nos resultados do catálogo.", v: [false, true, true, true] },
      { label: "Prioridade máxima na busca", desc: "Fica no topo, acima também dos outros planos pagos.", v: [false, false, true, true] },
      { label: "Vídeo de apresentação", desc: "Um vídeo curto seu no perfil, para o paciente te conhecer antes.", v: [false, false, true, true] },
      { label: "Selo de exterior em destaque", desc: "Destaque visual para quem busca atendimento fora do Brasil.", v: [false, false, true, true] },
      { label: "Responder no fórum", desc: "Responda dúvidas no fórum público e ganhe autoridade e visibilidade.", v: [false, false, true, true] },
    ],
  },
  {
    title: "Presença digital gerida",
    rows: [
      { label: "Conteúdo produzido pela Ayumana", desc: "Criamos 8 peças por mês para suas redes, com 1 rodada de revisão.", v: [false, false, false, true] },
      { label: "Onboarding humano e vaga garantida", desc: "Acompanhamento individual e vaga garantida (capacidade limitada).", v: [false, false, false, true] },
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
        <p className="mt-3 text-lg font-medium text-brand-dark">
          Crie raiz. Ganhe alcance. Tenha voz. Construa presença.
        </p>
        <p className="mt-2 text-foreground-muted">
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
                      p === POPULAR
                        ? "inline-block rounded-full bg-brand/15 px-3 py-1 text-sm font-semibold text-brand-dark"
                        : "text-sm font-semibold text-heading"
                    }
                  >
                    {p}
                  </span>
                  {p === POPULAR && (
                    <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-brand">
                      Mais popular
                    </span>
                  )}
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
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">{r.label}</p>
                      <p className="mt-0.5 text-xs text-foreground-muted">{r.desc}</p>
                    </td>
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
        Você começa no Raiz, grátis, e muda de plano quando quiser, sem
        fidelidade.
      </p>
    </section>
  );
}

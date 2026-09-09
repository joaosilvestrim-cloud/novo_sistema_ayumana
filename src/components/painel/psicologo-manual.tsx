"use client";

import { useMemo, useState } from "react";
import {
  Search, ChevronDown, UserCircle, IdCard, ShieldCheck, Globe2,
  MessagesSquare, CreditCard, Sparkles, TrendingUp, HelpCircle,
} from "lucide-react";

type Entry = { term?: string; text: string; tag?: string };
type Section = { id: string; icon: React.ElementType; title: string; intro?: string; entries: Entry[] };

const SECTIONS: Section[] = [
  {
    id: "conta", icon: UserCircle, title: "Sua conta e acesso",
    entries: [
      { term: "Criar conta", text: "Cria seu acesso gratuito. Nome, e-mail e senha (mínimo 8 caracteres). Você entra direto no painel." },
      { term: "Entrar e sair", text: "Use e-mail e senha para entrar. O botão “Sair” fica no topo do painel." },
      { term: "Esqueci a senha", text: "Informe o e-mail e receba um link para criar uma nova senha. É por aqui que entram quem veio da plataforma antiga." },
    ],
  },
  {
    id: "perfil", icon: IdCard, title: "Meu perfil — campo a campo",
    intro: "Você pode preencher tudo mesmo no plano gratuito. * = obrigatório para pedir a verificação.",
    entries: [
      { term: "Nome de exibição *", text: "Como você aparece no perfil e na busca. Pode ser diferente do nome do cadastro." },
      { term: "WhatsApp", text: "Com o país/DDI certo. É o número que o botão de WhatsApp do seu perfil usa." },
      { term: "Cidade e Estado (UF)", text: "Ajuda o paciente a te encontrar por localização." },
      { term: "Número e UF do CRP *", text: "Formato região/número. Ex.: 06/153352 · SP." },
      { term: "Documento do CRP *", text: "Carteira ou e-Psi (PDF ou imagem, até 10 MB). É privado, visto só pela equipe. O botão “Salvar documento” guarda o arquivo na hora." },
      { term: "Salvar documento ≠ Enviar para verificação", text: "Salvar só guarda o arquivo. Seu CRP só entra na fila quando você clica em “Enviar para verificação”, no fim da página." },
      { term: "Título do perfil *", text: "Uma frase de efeito. Ex.: “Psicóloga clínica para brasileiros na Europa.”" },
      { term: "Sobre você *", text: "Seu texto de apresentação, com formatação." },
      { term: "Vídeo de apresentação", tag: "Voz", text: "Você cola o link de um vídeo do YouTube ou Vimeo. Não é gravação nem upload. No perfil vira um botão “Assistir vídeo”." },
      { term: "Abordagens e temas", text: "Marque as suas. Servem de filtro na busca (inclui um foco em “quem vive no exterior”)." },
      { term: "Atendo brasileiros no exterior", text: "Ao marcar, escolha os países. É o que te coloca no filtro por país e nas páginas de cada país." },
      { term: "Valor da sessão", tag: "Alcance", text: "Seu preço por sessão (online e presencial)." },
      { term: "Aceitando novos pacientes", tag: "Alcance", text: "Liga um selo de agenda aberta no seu perfil." },
    ],
  },
  {
    id: "verificacao", icon: ShieldCheck, title: "Verificação e publicação",
    intro: "A verificação libera o selo de CRP e autoriza seu perfil a aparecer na busca.",
    entries: [
      { term: "Não enviado", text: "Você ainda não pediu a verificação." },
      { term: "Em análise", text: "Recebemos seus dados. A equipe confere no Cadastro Nacional de Psicólogos, em até ~2 dias úteis." },
      { term: "Verificado", text: "Aprovado. Você ganha o selo e o perfil é publicado automaticamente." },
      { term: "Reprovado", text: "Algo não conferiu. Mostramos o motivo para você corrigir e reenviar." },
      { term: "Quando reabre a verificação", text: "Editar o perfil não derruba o selo. Só reabre se você mudar o número/UF do CRP ou trocar o documento." },
    ],
  },
  {
    id: "publico", icon: Globe2, title: "Seu perfil público",
    intro: "A página que o paciente vê (no ar quando publicado). O que aparece depende do plano.",
    entries: [
      { term: "Sempre (Raiz+)", text: "Foto, nome, selo de CRP verificado, cidade, apresentação, temas, abordagens e o botão “Conversar no WhatsApp”." },
      { term: "Valor da sessão e agenda aberta", tag: "Alcance", text: "Passam a aparecer a partir do Alcance." },
      { term: "Vídeo e selo de exterior em destaque", tag: "Voz", text: "Aparecem a partir do Voz." },
      { term: "Compartilhar perfil", text: "Atalho no painel e no perfil para divulgar seu link e nas redes. Mais visitas = mais contatos." },
    ],
  },
  {
    id: "forum", icon: MessagesSquare, title: "Fórum",
    intro: "Pacientes perguntam (anônimo) e psicólogos respondem. Suas respostas aparecem no seu perfil.",
    entries: [
      { term: "Quem pode responder", tag: "Voz", text: "Estar no plano Voz ou Presença e ter o CRP verificado." },
      { term: "Como responder", text: "Na aba Fórum, abra uma pergunta e escreva (mín. 20 caracteres, sem diagnósticos). Passa por moderação e depois é publicada com seu nome." },
    ],
  },
  {
    id: "planos", icon: CreditCard, title: "Planos e assinatura",
    intro: "Raiz é grátis. Alcance e Voz você contrata sozinho em Assinatura. Sem fidelidade.",
    entries: [
      { term: "Raiz", text: "Grátis, para sempre. Perfil completo, selo de CRP, WhatsApp, aparece na busca e atende no exterior." },
      { term: "Alcance", text: "Mostra o valor da sessão, selo de agenda aberta e prioridade na busca (acima dos gratuitos)." },
      { term: "Voz", text: "Topo da busca, vídeo de apresentação, selo de exterior em destaque e responder no fórum." },
      { term: "Presença", text: "Tudo do Voz + a Ayumana cria seu conteúdo de Instagram (8 peças/mês). Vaga limitada, entrada por contato." },
      { term: "Como assinar", text: "Em Assinatura, escolha mensal/anual, informe CPF/CNPJ na 1ª vez e pague no Asaas (Pix, boleto ou cartão). O plano entra no ar quando o pagamento confirma." },
      { term: "Anual", text: "25% de desconto, pago uma vez por ano." },
      { term: "Trocar e cancelar", text: "Quando quiser. Ao cancelar você volta ao Raiz e o perfil continua no ar." },
      { term: "Evite cobrança dupla", text: "Não clique duas vezes no checkout nem recarregue a página. Pague só um boleto. Em dúvida, fale com a equipe antes." },
      { term: "90 dias de Voz grátis", text: "Ao completar o perfil e ter o CRP aprovado, você ganha 90 dias de Voz de cortesia, sem cartão. Depois volta ao plano contratado." },
    ],
  },
  {
    id: "presenca", icon: Sparkles, title: "Presença e Estúdio",
    entries: [
      { term: "Meu conteúdo", text: "Quem tem Presença acompanha as peças do mês, aprova ou pede ajuste e baixa prontas." },
      { term: "Como entrar", text: "Vagas limitadas, não é por botão. Entre na fila do Presença (página “Para psicólogos”): nome, e-mail, WhatsApp e um resumo. A equipe chama conforme abre vaga." },
    ],
  },
  {
    id: "busca", icon: TrendingUp, title: "Como aparecer mais na busca",
    intro: "A ordem dos perfis considera três coisas:",
    entries: [
      { term: "Plano", text: "Presença e Voz na frente, depois Alcance, por fim os gratuitos." },
      { term: "Qualidade do perfil", text: "Foto, apresentação, temas, abordagem, vídeo e preço preenchidos pesam a favor." },
      { term: "Rotação diária", text: "Há um rodízio para dar palco a todos dentro da mesma faixa." },
      { term: "Na prática", text: "Um perfil completo aparece melhor que um incompleto do mesmo plano. Preencha tudo, adicione foto e vídeo, responda no fórum e compartilhe." },
    ],
  },
  {
    id: "faq", icon: HelpCircle, title: "Perguntas frequentes",
    entries: [
      { term: "Quando meu perfil aparece na busca?", text: "Assim que o CRP é aprovado, ele é publicado automaticamente." },
      { term: "O paciente paga pela Ayumana?", text: "Não. Contato e pagamento das sessões são combinados direto com você, pelo WhatsApp. Sem comissão." },
      { term: "O vídeo é gravado no site?", text: "Não. Você cola o link de um vídeo do YouTube ou Vimeo." },
      { term: "Como entro no Presença?", text: "Pela fila, na página “Para psicólogos”. As vagas são limitadas." },
    ],
  },
];

function matches(s: Section, q: string): Entry[] {
  if (!q) return s.entries;
  const t = q.toLowerCase();
  if (s.title.toLowerCase().includes(t)) return s.entries;
  return s.entries.filter((e) => `${e.term ?? ""} ${e.text} ${e.tag ?? ""}`.toLowerCase().includes(t));
}

export function PsicologoManual() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({ perfil: true });

  const visiveis = useMemo(
    () => SECTIONS.map((s) => ({ s, entries: matches(s, q) })).filter((x) => x.entries.length > 0),
    [q]
  );
  const buscando = q.trim().length > 0;

  return (
    <section id="manual" className="scroll-mt-24 rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">Manual do psicólogo</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">Como funciona cada função do sistema. Clique em uma seção ou busque.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar no manual…"
            className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {visiveis.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-foreground-muted">
            Nada encontrado para “{q}”. Tente outra palavra, ou fale com a equipe pelo botão Ajuda.
          </p>
        )}

        {visiveis.map(({ s, entries }) => {
          const Icon = s.icon;
          const aberto = buscando || open[s.id];
          return (
            <div key={s.id} className="overflow-hidden rounded-xl border border-border">
              <button
                onClick={() => setOpen((o) => ({ ...o, [s.id]: !o[s.id] }))}
                className="flex w-full items-center gap-3 bg-surface-muted/50 px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                aria-expanded={aberto}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 font-medium text-heading">{s.title}</span>
                {!buscando && (
                  <ChevronDown className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${aberto ? "rotate-180" : ""}`} />
                )}
              </button>

              {aberto && (
                <div className="space-y-3 px-4 py-3.5">
                  {s.intro && !buscando && <p className="text-sm text-foreground-muted">{s.intro}</p>}
                  {entries.map((e, i) => (
                    <div key={i} className="text-sm">
                      {e.term && (
                        <span className="font-semibold text-heading">
                          {e.term}
                          {e.tag && (
                            <span className="ml-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark align-middle">
                              aparece no {e.tag}
                            </span>
                          )}
                          {" — "}
                        </span>
                      )}
                      <span className="text-foreground">{e.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

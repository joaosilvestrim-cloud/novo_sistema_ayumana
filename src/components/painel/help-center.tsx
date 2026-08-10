"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check, Lock, Sparkles, CreditCard, MessageCircle, ChevronDown,
  Leaf, TrendingUp, Mic, Palette, ArrowRight, CircleHelp, Star,
} from "lucide-react";
import type { PlanTier } from "@/lib/types";

/** Ordem dos planos, do grátis ao topo. */
const PLANS: {
  tier: PlanTier;
  nome: string;
  preco: string;
  chamada: string;
  cor: string;
  icon: React.ElementType;
  selfService: boolean;
}[] = [
  { tier: "essencial", nome: "Raiz", preco: "Grátis", chamada: "Seu perfil no ar, para sempre.", cor: "#73A533", icon: Leaf, selfService: true },
  { tier: "destaque", nome: "Alcance", preco: "R$ 24,90/mês", chamada: "Mais visto na busca.", cor: "#53C4CC", icon: TrendingUp, selfService: true },
  { tier: "ideal", nome: "Voz", preco: "R$ 39,90/mês", chamada: "Autoridade e topo da busca.", cor: "#F5C84B", icon: Mic, selfService: true },
  { tier: "presenca", nome: "Presença", preco: "R$ 297/mês", chamada: "A gente cuida das suas redes.", cor: "#05474A", icon: Palette, selfService: false },
];

/** Recursos em ordem, com o índice do plano mínimo que libera cada um. */
const FEATURES: { label: string; desc: string; min: number }[] = [
  { label: "Perfil completo", desc: "Foto, cidade, WhatsApp, e-mail e Instagram no seu perfil público.", min: 0 },
  { label: "Selo de CRP verificado", desc: "Conferimos seu registro e você ganha o selo de conta verificada.", min: 0 },
  { label: "Contato direto pelo WhatsApp", desc: "O paciente fala com você direto, sem comissão sobre a sessão.", min: 0 },
  { label: "Aparece na busca do catálogo", desc: "Encontrado por queixa, abordagem e fuso horário.", min: 0 },
  { label: "Atende no exterior", desc: "Marque os países que atende e apareça no filtro por país.", min: 0 },
  { label: "Exibição do valor da sessão", desc: "Mostra o preço, online e presencial, no seu perfil.", min: 1 },
  { label: "Indicador de agenda aberta", desc: "Selo de aceitando novos pacientes no perfil e na busca.", min: 1 },
  { label: "Prioridade na busca", desc: "Seu perfil aparece acima dos gratuitos nos resultados.", min: 1 },
  { label: "Prioridade máxima na busca", desc: "Fica no topo, acima também dos outros planos pagos.", min: 2 },
  { label: "Vídeo de apresentação", desc: "Um vídeo curto seu no perfil, para o paciente te conhecer antes.", min: 2 },
  { label: "Selo de exterior em destaque", desc: "Destaque visual para quem busca atendimento fora do Brasil.", min: 2 },
  { label: "Responder no fórum", desc: "Responda dúvidas no fórum público e ganhe autoridade.", min: 2 },
  { label: "Conteúdo produzido pela Ayumana", desc: "Criamos 8 peças por mês para suas redes, com 1 rodada de revisão.", min: 3 },
  { label: "Onboarding humano e vaga garantida", desc: "Acompanhamento individual e vaga garantida, capacidade limitada.", min: 3 },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Como funciona o pagamento?", a: "A cobrança é mensal, pelo Asaas, no Pix, boleto ou cartão. Sem fidelidade e sem multa: você cancela quando quiser." },
  { q: "Quando meu plano entra no ar depois que pago?", a: "Assim que o pagamento é confirmado. No Pix costuma ser em minutos. No boleto pode levar de 1 a 2 dias úteis. Você recebe um e-mail quando o plano é liberado." },
  { q: "Posso trocar de plano depois?", a: "Pode, quando quiser. Ao assinar um plano novo, a cobrança do anterior é cancelada automaticamente. Você nunca fica com duas cobranças." },
  { q: "Como cancelo?", a: "Na tela de Assinatura tem o botão de cancelar. Ao cancelar, seu perfil volta para o plano Raiz, que é grátis e continua no ar." },
  { q: "Recebi um teste grátis do Voz. Como é?", a: "Enquanto o teste está valendo, seu perfil tem tudo do plano Voz. Quando o teste acaba, ele volta sozinho para o seu plano contratado, sem cobrar nada." },
  { q: "O que é o plano Presença?", a: "No Presença, nossa equipe cria as artes das suas redes sociais todo mês e você acompanha por aqui. A vaga é limitada, então a entrada é por contato com a equipe, não pelo botão de assinar." },
];

export function HelpCenter({ currentPlan, supportWhatsapp }: { currentPlan: PlanTier; supportWhatsapp: string }) {
  const idxAtual = PLANS.findIndex((p) => p.tier === currentPlan);
  const [sel, setSel] = useState(Math.max(0, idxAtual));
  const [comparar, setComparar] = useState(false);
  const [aberto, setAberto] = useState<number | null>(0);

  const plano = PLANS[sel];
  const incluidos = FEATURES.filter((f) => f.min <= sel);
  const bloqueados = FEATURES.filter((f) => f.min > sel);
  const ehAtual = sel === idxAtual;

  const waLink = `https://wa.me/${supportWhatsapp}?text=${encodeURIComponent("Olá! Tenho interesse no plano Presença da Ayumana.")}`;

  return (
    <div className="space-y-8">
      {/* Seletor de planos */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {PLANS.map((p, i) => {
          const Icon = p.icon;
          const ativo = i === sel;
          const meu = i === idxAtual;
          return (
            <button
              key={p.tier}
              onClick={() => setSel(i)}
              className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                ativo ? "shadow-md" : "border-border hover:border-foreground-muted/40"
              }`}
              style={ativo ? { borderColor: p.cor } : undefined}
            >
              {meu && (
                <span className="absolute right-2 top-2 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                  Seu plano
                </span>
              )}
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${p.cor}22`, color: p.cor }}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-2 flex items-center gap-1 font-semibold text-heading">
                {p.nome}
                {p.tier === "ideal" && <Star className="h-3.5 w-3.5 fill-[#F5C84B] text-[#F5C84B]" />}
              </p>
              <p className="text-sm font-medium" style={{ color: p.cor === "#F5C84B" ? "#05474A" : p.cor }}>{p.preco}</p>
              <p className="mt-1 text-xs text-foreground-muted">{p.chamada}</p>
            </button>
          );
        })}
      </div>

      {/* Detalhe do plano selecionado */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5" style={{ background: `${plano.cor}14` }}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-heading">{plano.nome}</h2>
              {plano.tier === "ideal" && (
                <span className="rounded-full bg-[#F5C84B]/25 px-2 py-0.5 text-[11px] font-bold text-[#8A6D00]">Mais popular</span>
              )}
            </div>
            <p className="text-sm text-foreground-muted">{plano.chamada}</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: plano.cor === "#F5C84B" ? "#05474A" : plano.cor }}>{plano.preco}</p>
        </div>

        <div className="grid gap-6 p-5 md:grid-cols-2">
          {/* O que traz */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">O que este plano traz</p>
            <ul className="space-y-2">
              {incluidos.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>
                    <span className="text-sm font-medium text-heading">{f.label}</span>
                    <span className="block text-xs text-foreground-muted">{f.desc}</span>
                  </span>
                </li>
              ))}
            </ul>

            {bloqueados.length > 0 && (
              <div className="mt-4 rounded-xl bg-surface-muted/60 p-3">
                <p className="mb-2 text-xs font-medium text-foreground-muted">
                  Subindo de plano, você ainda desbloqueia:
                </p>
                <ul className="space-y-1.5">
                  {bloqueados.slice(0, 4).map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Lock className="h-3 w-3 shrink-0" /> {f.label}
                    </li>
                  ))}
                  {bloqueados.length > 4 && (
                    <li className="text-xs text-foreground-muted">e mais {bloqueados.length - 4}...</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Como adquirir */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Como adquirir</p>
            <ComoAdquirir plano={plano} />

            <div className="mt-5">
              {ehAtual ? (
                <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-muted text-sm font-medium text-foreground-muted">
                  <Check className="h-4 w-4" /> Este é o seu plano atual
                </span>
              ) : plano.tier === "essencial" ? (
                <Link href="/painel/assinatura" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold text-heading hover:bg-surface-muted">
                  Voltar ao Raiz <ArrowRight className="h-4 w-4" />
                </Link>
              ) : plano.selfService ? (
                <Link href="/painel/assinatura" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                  <CreditCard className="h-4 w-4" /> Assinar {plano.nome}
                </Link>
              ) : (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1ebe5b]">
                  <MessageCircle className="h-4 w-4" /> Falar com a equipe
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparação completa */}
      <div>
        <button
          onClick={() => setComparar((c) => !c)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-heading hover:bg-surface-muted"
        >
          <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-dark" /> Ver a comparação completa dos planos</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${comparar ? "rotate-180" : ""}`} />
        </button>
        {comparar && <TabelaComparacao idxAtual={idxAtual} onSelect={setSel} />}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-heading">
          <CircleHelp className="h-5 w-5 text-brand-dark" /> Perguntas frequentes
        </h2>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
          {FAQ.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setAberto(aberto === i ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-heading hover:bg-surface-muted/50"
              >
                {item.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${aberto === i ? "rotate-180" : ""}`} />
              </button>
              {aberto === i && (
                <p className="px-4 pb-4 text-sm leading-relaxed text-foreground-muted">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ajuda humana */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-5">
        <div>
          <p className="font-semibold text-heading">Ainda com dúvida?</p>
          <p className="text-sm text-foreground-muted">A gente responde no WhatsApp em horário comercial.</p>
        </div>
        <a
          href={`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent("Olá! Preciso de ajuda com os planos da Ayumana.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white hover:bg-[#1ebe5b]"
        >
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}

function ComoAdquirir({ plano }: { plano: (typeof PLANS)[number] }) {
  const passos =
    plano.tier === "essencial"
      ? ["O Raiz é o plano inicial de todo perfil. Você já tem, e é grátis para sempre.", "É só manter seu perfil completo para aparecer bem na busca."]
      : plano.selfService
        ? [
            "Abra Assinatura, no menu do painel.",
            `Escolha o plano ${plano.nome} e clique em Assinar.`,
            "Informe seu CPF ou CNPJ. Só pedimos na primeira vez.",
            "Pague por Pix, boleto ou cartão, na tela do Asaas.",
            "Assim que o pagamento confirmar, seu plano entra no ar e você recebe um e-mail.",
          ]
        : [
            "Clique em Falar com a equipe aqui embaixo.",
            "A gente explica como funciona e confirma se há vaga aberta.",
            "Fazemos seu onboarding e começamos a produzir suas peças no mês seguinte.",
          ];

  return (
    <ol className="space-y-2.5">
      {passos.map((p, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
          <span className="pt-0.5 text-sm leading-snug text-foreground">{p}</span>
        </li>
      ))}
    </ol>
  );
}

function TabelaComparacao({ idxAtual, onSelect }: { idxAtual: number; onSelect: (i: number) => void }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-background">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-2/5 px-4 py-3 text-left font-medium text-heading">Recurso</th>
            {PLANS.map((p, i) => (
              <th key={p.tier} className="px-2 py-3 text-center">
                <button onClick={() => onSelect(i)} className="text-xs font-semibold text-heading hover:underline">
                  {p.nome}
                  {i === idxAtual && <span className="block text-[9px] font-medium text-brand-dark">seu plano</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((f) => (
            <tr key={f.label} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{f.label}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">{f.desc}</p>
              </td>
              {PLANS.map((_, i) => (
                <td key={i} className="px-2 py-3 text-center">
                  {f.min <= i ? (
                    <Check className="mx-auto h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-neutral-300">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

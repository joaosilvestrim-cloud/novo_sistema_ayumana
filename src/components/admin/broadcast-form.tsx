"use client";

import { useEffect, useState, useTransition } from "react";
import { Megaphone, Send, FlaskConical, Users } from "lucide-react";
import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier } from "@/lib/types";
import { sendBroadcastAction, countAudienceAction, type Audience } from "@/app/admin/notificacoes/actions";

const TIERS: PlanTier[] = ["essencial", "destaque", "ideal", "presenca"];

const PUBLICOS: { value: Audience; label: string; hint: string }[] = [
  { value: "todos", label: "Todos os psicólogos", hint: "toda a base cadastrada" },
  { value: "publicados", label: "Somente publicados", hint: "perfis visíveis no site" },
  { value: "em_teste", label: "Em teste gratuito", hint: "quem está com o teste do Voz rodando" },
  { value: "pagantes", label: "Assinantes pagos", hint: "qualquer plano acima do Raiz" },
  { value: "incompletos", label: "Perfil incompleto", hint: "cadastrou mas não terminou" },
  { value: "plano", label: "Um plano específico", hint: "escolha o plano ao lado" },
  { value: "avulso", label: "E-mails avulsos", hint: "digite os endereços" },
];

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand";

export function BroadcastForm() {
  const [aberto, setAberto] = useState(false);
  const [publico, setPublico] = useState<Audience>("todos");
  const [plano, setPlano] = useState<PlanTier>("ideal");
  const [quantos, setQuantos] = useState<number | null>(null);
  const [contando, startCount] = useTransition();

  useEffect(() => {
    if (!aberto || publico === "avulso") {
      setQuantos(null);
      return;
    }
    startCount(async () => {
      setQuantos(await countAudienceAction(publico, plano));
    });
  }, [aberto, publico, plano]);

  const hint = PUBLICOS.find((p) => p.value === publico)?.hint;

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        <Megaphone className="h-4 w-4" /> Nova notificação
      </button>
    );
  }

  return (
    <form action={sendBroadcastAction} className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-heading">
          <Megaphone className="h-5 w-5 text-brand-dark" /> Nova notificação
        </h2>
        <button type="button" onClick={() => setAberto(false)} className="text-sm text-foreground-muted hover:underline">
          Cancelar
        </button>
      </div>

      {/* Público */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-heading">Para quem</label>
          <select
            name="publico"
            value={publico}
            onChange={(e) => setPublico(e.target.value as Audience)}
            className={input}
          >
            {PUBLICOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-foreground-muted">{hint}</p>
        </div>

        {publico === "plano" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-heading">Plano</label>
            <select name="plano" value={plano} onChange={(e) => setPlano(e.target.value as PlanTier)} className={input}>
              {TIERS.map((t) => <option key={t} value={t}>{PLAN_LABEL[t]}</option>)}
            </select>
          </div>
        )}

        {publico === "avulso" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-heading">E-mails</label>
            <input name="email_avulso" placeholder="um@exemplo.com, outro@exemplo.com" className={input} />
          </div>
        )}
      </div>

      {publico !== "avulso" && (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5 text-sm text-foreground-muted">
          <Users className="h-4 w-4" />
          {contando ? "Contando..." : `${quantos ?? 0} destinatário(s)`}
        </p>
      )}

      {/* Conteúdo */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-heading">Assunto</label>
        <input name="assunto" required maxLength={120} placeholder="Ex.: Novidade na sua vitrine" className={input} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-heading">
          Título dentro do e-mail <span className="font-normal text-foreground-muted">(opcional)</span>
        </label>
        <input name="titulo" maxLength={120} placeholder="Se vazio, usa o assunto" className={input} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-heading">Mensagem</label>
        <textarea name="corpo" required rows={6} className={input} placeholder="Escreva normalmente. Cada quebra de linha vira uma linha no e-mail." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-heading">
            Texto do botão <span className="font-normal text-foreground-muted">(opcional)</span>
          </label>
          <input name="cta_label" maxLength={40} placeholder="Ex.: Ver meu perfil" className={input} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-heading">Link do botão</label>
          <input name="cta_url" type="url" placeholder="https://ayumana.com.br/painel" className={input} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          name="teste"
          value="1"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-muted"
        >
          <FlaskConical className="h-4 w-4" /> Enviar teste para mim
        </button>
        <button
          name="teste"
          value="0"
          onClick={(e) => {
            const alvo = publico === "avulso" ? "os e-mails informados" : `${quantos ?? 0} pessoa(s)`;
            if (!window.confirm(`Enviar este e-mail para ${alvo}? Não dá para desfazer.`)) e.preventDefault();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Send className="h-4 w-4" /> Enviar agora
        </button>
      </div>
    </form>
  );
}

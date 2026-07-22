"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  X, Check, RefreshCw, Send, Download, Copy, ImageOff, MessageCircle,
  Sparkles, Plus, CalendarDays, ChevronRight, PartyPopper,
} from "lucide-react";
import { CONTENT_FORMAT_LABEL, CONTENT_STATUS_MAP, type ContentFormat } from "@/lib/types";
import type { ItemDetail } from "@/lib/studio";
import { Conversa } from "@/components/studio/conversa";
import {
  approveItemAction, requestChangesAction, psyCommentAction,
  markPsySeenAction, requestPieceAction,
} from "@/app/painel/conteudo/actions";

const FORMATS: ContentFormat[] = ["post", "story", "reel", "carrossel", "outro"];

function Miniatura({ item, alto = false }: { item: ItemDetail; alto?: boolean }) {
  const capa = item.versions[0]?.url ?? item.asset_url;
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl bg-surface-muted ${alto ? "aspect-square w-full" : "h-16 w-16"}`}>
      {capa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={capa} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-foreground-muted">
          <ImageOff className={alto ? "h-8 w-8" : "h-4 w-4"} />
        </div>
      )}
      {item.versions.length > 1 && (
        <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1.5 text-[10px] font-bold text-white">
          v{item.versions[0].version}
        </span>
      )}
    </div>
  );
}

/** Painel de uma peça: arte grande, conversa e as duas decisões. */
function PecaModal({ item, onClose }: { item: ItemDetail; onClose: () => void }) {
  const [pedindo, setPedindo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const marcado = useRef(false);
  const capa = item.versions[0]?.url ?? item.asset_url;
  const meta = CONTENT_STATUS_MAP[item.status];
  const decide = meta.side === "psicologo";

  useEffect(() => {
    if (marcado.current || item.novasParaPsicologo === 0) return;
    marcado.current = true;
    const fd = new FormData();
    fd.set("id", item.id);
    void markPsySeenAction(fd);
  }, [item.id, item.novasParaPsicologo]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const copiarLegenda = () => {
    const txt = [item.caption, item.hashtags].filter(Boolean).join("\n\n");
    void navigator.clipboard.writeText(txt);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:flex-row"
      >
        {/* Arte */}
        <div className="flex shrink-0 flex-col bg-surface-muted/60 p-4 md:w-[45%]">
          <Miniatura item={item} alto />
          {capa && (
            <a
              href={capa}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-semibold hover:bg-surface-muted"
            >
              <Download className="h-4 w-4" /> Baixar a arte
            </a>
          )}
          {item.versions.length > 1 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">Versões anteriores</p>
              <div className="flex flex-wrap gap-1.5">
                {item.versions.slice(1).map((v) => (
                  <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="relative h-11 w-11 overflow-hidden rounded-md border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.url} alt={`v${v.version}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-black/65 px-1 text-[9px] font-bold text-white">v{v.version}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-border p-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-heading">{item.title}</h2>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {CONTENT_FORMAT_LABEL[item.format]} · {meta.psyLabel}
              </p>
            </div>
            <button onClick={onClose} className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Legenda pronta */}
          {(item.caption || item.hashtags) && (
            <div className="border-b border-border bg-lime-50/50 p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-lime-800">Legenda pronta</p>
                <button onClick={copiarLegenda} className="inline-flex items-center gap-1 text-xs font-medium text-lime-800 hover:underline">
                  <Copy className="h-3 w-3" /> {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>
              <p className="max-h-24 overflow-y-auto whitespace-pre-wrap text-sm text-heading">
                {item.caption}
                {item.hashtags && <span className="mt-1 block text-brand-dark">{item.hashtags}</span>}
              </p>
            </div>
          )}

          <Conversa comments={item.comments} meuLado="psicologo" />

          {/* Ações */}
          <div className="border-t border-border p-3">
            {decide && !pedindo && (
              <div className="mb-2 flex gap-2">
                <form action={approveItemAction} className="flex-1">
                  <input type="hidden" name="id" value={item.id} />
                  <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ayu-verde,#73A533)] text-sm font-bold text-white hover:opacity-90">
                    <Check className="h-4 w-4" /> Aprovar
                  </button>
                </form>
                <button
                  onClick={() => setPedindo(true)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 text-sm font-bold text-orange-800 hover:bg-orange-100"
                >
                  <RefreshCw className="h-4 w-4" /> Pedir ajuste
                </button>
              </div>
            )}

            {decide && pedindo && (
              <form action={requestChangesAction} className="mb-2 space-y-2 rounded-lg border border-orange-200 bg-orange-50/60 p-3">
                <input type="hidden" name="id" value={item.id} />
                <label className="block text-sm font-semibold text-orange-900">O que você quer mudar?</label>
                <textarea
                  name="body"
                  required
                  rows={3}
                  autoFocus
                  placeholder="Ex.: trocar a cor de fundo para o verde da marca e deixar o texto maior"
                  className="w-full resize-none rounded-lg border border-orange-200 bg-background px-3 py-2 text-sm outline-none focus:border-orange-400"
                />
                <div className="flex gap-2">
                  <button className="h-9 flex-1 rounded-lg bg-orange-600 text-sm font-semibold text-white hover:bg-orange-700">
                    Enviar pedido
                  </button>
                  <button type="button" onClick={() => setPedindo(false)} className="h-9 rounded-lg border border-border px-4 text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <form action={psyCommentAction} className="flex items-end gap-2">
              <input type="hidden" name="id" value={item.id} />
              <textarea
                name="body"
                rows={1}
                required
                placeholder="Falar com o estúdio..."
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Card grande, usado na faixa que exige decisão. */
function CardDestaque({ item, onOpen }: { item: ItemDetail; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group overflow-hidden rounded-2xl border-2 border-amber-300 bg-background text-left shadow-sm transition-shadow hover:shadow-lg"
    >
      <Miniatura item={item} alto />
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-heading">{item.title}</p>
        <p className="mt-0.5 text-xs text-foreground-muted">{CONTENT_FORMAT_LABEL[item.format]}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-amber-800">
          Ver e decidir <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

/** Linha compacta, usada nas faixas que não exigem ação. */
function LinhaPeca({ item, onOpen }: { item: ItemDetail; onOpen: () => void }) {
  const meta = CONTENT_STATUS_MAP[item.status];
  const pronto = item.status === "entregue";
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-2.5 text-left transition-colors hover:border-brand/50 hover:bg-surface-muted/40"
    >
      <Miniatura item={item} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-heading">{item.title}</p>
        <p className="truncate text-xs text-foreground-muted">
          {CONTENT_FORMAT_LABEL[item.format]} · {meta.hint}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${pronto ? "bg-lime-50 text-lime-700" : "bg-surface-muted text-foreground-muted"}`}>
            {meta.psyLabel}
          </span>
          {item.due_date && !pronto && (
            <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted">
              <CalendarDays className="h-3 w-3" />
              {new Date(`${item.due_date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
          )}
          {item.novasParaPsicologo > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand-dark">
              <MessageCircle className="h-3 w-3" /> {item.novasParaPsicologo}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
    </button>
  );
}

function PedirPeca() {
  const [aberto, setAberto] = useState(false);
  const [, start] = useTransition();

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/50 bg-brand/5 px-4 text-sm font-semibold text-brand-dark hover:bg-brand/10"
      >
        <Plus className="h-4 w-4" /> Pedir uma peça
      </button>
    );
  }

  return (
    <form
      action={(fd) => start(() => { void requestPieceAction(fd); setAberto(false); })}
      className="space-y-3 rounded-2xl border border-brand/40 bg-brand/5 p-4"
    >
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold text-heading">
          <Sparkles className="h-4 w-4 text-brand-dark" /> Pedir uma peça ao estúdio
        </p>
        <button type="button" onClick={() => setAberto(false)} className="text-sm text-foreground-muted hover:underline">
          Cancelar
        </button>
      </div>
      <input
        name="title"
        required
        maxLength={140}
        placeholder="Sobre o que é? Ex.: Como saber a hora de procurar terapia"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <div className="flex flex-wrap gap-2">
        <select name="format" className="h-10 rounded-lg border border-border bg-background px-2 text-sm">
          {FORMATS.map((f) => <option key={f} value={f}>{CONTENT_FORMAT_LABEL[f]}</option>)}
        </select>
        <button className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Enviar pedido
        </button>
      </div>
      <textarea
        name="brief"
        rows={3}
        placeholder="Quer dar alguma direção? Tom, referência, o que não pode faltar... (opcional)"
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </form>
  );
}

export function PsyContent({ items, mes }: { items: ItemDetail[]; mes: string }) {
  const [aberto, setAberto] = useState<string | null>(null);

  const comVoce = items.filter((i) => CONTENT_STATUS_MAP[i.status].side === "psicologo");
  const noEstudio = items.filter((i) => CONTENT_STATUS_MAP[i.status].side === "estudio");
  const prontas = items.filter((i) => i.status === "entregue");
  const progresso = items.length ? Math.round((prontas.length / items.length) * 100) : 0;

  const itemAberto = items.find((i) => i.id === aberto) ?? null;

  return (
    <div className="space-y-6">
      {/* Pulso do mês */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl">Meu conteúdo</h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Peças de {mes} criadas pelo estúdio para o seu Instagram.
            </p>
          </div>
          <PedirPeca />
        </div>

        {items.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-heading">{prontas.length} de {items.length} prontas</span>
              <span className="text-foreground-muted">{progresso}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-[var(--ayu-verde,#73A533)] transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        )}
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
          <p className="font-medium text-heading">Ainda não há peças para {mes}.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-foreground-muted">
            O estúdio prepara seu pacote no começo do mês. Se já tem um tema em mente, peça agora e a gente encaixa.
          </p>
        </div>
      )}

      {/* 1. Precisa de você */}
      {comVoce.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-amber-950">
              {comVoce.length}
            </span>
            <div>
              <h2 className="font-bold text-amber-950">Esperando você</h2>
              <p className="text-xs text-amber-900/80">Aprove ou peça ajuste para o estúdio seguir</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {comVoce.map((it) => (
              <CardDestaque key={it.id} item={it} onOpen={() => setAberto(it.id)} />
            ))}
          </div>
        </section>
      )}

      {/* 2. No estúdio */}
      {noEstudio.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-heading">
            <RefreshCw className="h-4 w-4 text-brand-dark" /> O estúdio está cuidando
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
              {noEstudio.length}
            </span>
          </h2>
          <p className="mb-3 text-sm text-foreground-muted">
            Nada para fazer agora. Avisamos assim que precisar do seu olhar.
          </p>
          <div className="space-y-2">
            {noEstudio.map((it) => (
              <LinhaPeca key={it.id} item={it} onOpen={() => setAberto(it.id)} />
            ))}
          </div>
        </section>
      )}

      {/* 3. Prontas */}
      {prontas.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-heading">
            <PartyPopper className="h-4 w-4 text-[var(--ayu-verde,#73A533)]" /> Prontas para publicar
            <span className="rounded-full bg-lime-50 px-2 py-0.5 text-xs font-medium text-lime-700">
              {prontas.length}
            </span>
          </h2>
          <p className="mb-3 text-sm text-foreground-muted">
            Baixe a arte, copie a legenda e publique quando quiser.
          </p>
          <div className="space-y-2">
            {prontas.map((it) => (
              <LinhaPeca key={it.id} item={it} onOpen={() => setAberto(it.id)} />
            ))}
          </div>
        </section>
      )}

      {itemAberto && <PecaModal item={itemAberto} onClose={() => setAberto(null)} />}
    </div>
  );
}

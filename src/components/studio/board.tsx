"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  MessageCircle, Clock, AlertTriangle, ImageOff, Layers, GripVertical, CalendarDays, Hand,
} from "lucide-react";
import { CONTENT_STATUS, CONTENT_FORMAT_LABEL, type ContentStatusKey } from "@/lib/types";
import type { ItemDetail } from "@/lib/studio";
import { reorderAction } from "@/app/estudio/actions";
import { ItemDrawer } from "@/components/studio/item-drawer";

/** Cor de cada etapa. A de revisão é a única quente, porque é a que trava o fluxo. */
const COL_COR: Record<ContentStatusKey, { barra: string; chip: string; fundo: string }> = {
  briefing: { barra: "#94A3A0", chip: "bg-slate-100 text-slate-600", fundo: "bg-slate-50/60" },
  producao: { barra: "#53C4CC", chip: "bg-cyan-50 text-cyan-700", fundo: "bg-cyan-50/40" },
  revisao: { barra: "#F5C84B", chip: "bg-amber-100 text-amber-800", fundo: "bg-amber-50/60" },
  ajustes: { barra: "#E8833A", chip: "bg-orange-50 text-orange-700", fundo: "bg-orange-50/40" },
  aprovado: { barra: "#73A533", chip: "bg-lime-50 text-lime-700", fundo: "bg-lime-50/40" },
  entregue: { barra: "#05474A", chip: "bg-teal-50 text-teal-800", fundo: "bg-teal-50/40" },
};

function Prazo({ dias }: { dias: number | null }) {
  if (dias === null) return null;
  const atrasado = dias < 0;
  const hoje = dias === 0;
  const perto = dias > 0 && dias <= 2;
  const cor = atrasado
    ? "bg-red-50 text-red-700"
    : hoje
      ? "bg-amber-100 text-amber-800"
      : perto
        ? "bg-amber-50 text-amber-700"
        : "bg-surface-muted text-foreground-muted";
  const texto = atrasado
    ? `${Math.abs(dias)}d atrasada`
    : hoje
      ? "vence hoje"
      : `em ${dias}d`;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${cor}`}>
      <CalendarDays className="h-3 w-3" /> {texto}
    </span>
  );
}

function Card({
  item,
  onOpen,
  onDragStart,
}: {
  item: ItemDetail;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
}) {
  const capa = item.versions[0]?.url ?? item.asset_url;
  const naoLidas = item.novasParaEstudio;
  const parada = item.diasParada >= 4 && item.status !== "entregue";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="group cursor-pointer rounded-xl border border-border bg-background p-2.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="mb-2 flex items-start gap-2">
        {/* miniatura */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
          {capa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capa} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground-muted">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
          {item.versions.length > 1 && (
            <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/65 px-1 text-[10px] font-semibold text-white">
              v{item.versions[0].version}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-heading">{item.title}</p>
          <p className="mt-0.5 text-[11px] text-foreground-muted">{CONTENT_FORMAT_LABEL[item.format]}</p>
        </div>

        <GripVertical className="h-4 w-4 shrink-0 text-border opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Prazo dias={item.diasPrazo} />
        {naoLidas > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand-dark">
            <MessageCircle className="h-3 w-3" /> {naoLidas}
          </span>
        )}
        {item.comments.length > 0 && naoLidas === 0 && (
          <span className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] text-foreground-muted">
            <MessageCircle className="h-3 w-3" /> {item.comments.length}
          </span>
        )}
        {parada && (
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] text-foreground-muted" title="Sem movimento">
            <Clock className="h-3 w-3" /> {item.diasParada}d
          </span>
        )}
        {item.requested_by && (
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700" title="Pedida pelo psicólogo">
            <Hand className="h-3 w-3" /> pedido
          </span>
        )}
      </div>
    </div>
  );
}

export function StudioBoard({
  items,
  psyId,
  psyNome,
}: {
  items: ItemDetail[];
  psyId: string;
  psyNome: string | null;
}) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<ContentStatusKey | null>(null);

  // Move na hora na tela e confirma no servidor em seguida.
  const [lista, moverOtimista] = useOptimistic(
    items,
    (atual: ItemDetail[], mov: { id: string; status: ContentStatusKey }) =>
      atual.map((i) => (i.id === mov.id ? { ...i, status: mov.status } : i))
  );

  const porEtapa = useMemo(() => {
    const m = new Map<ContentStatusKey, ItemDetail[]>();
    for (const s of CONTENT_STATUS) m.set(s.key, []);
    for (const i of lista) m.get(i.status)?.push(i);
    return m;
  }, [lista]);

  const soltar = (status: ContentStatusKey) => {
    const id = arrastando;
    setArrastando(null);
    setAlvo(null);
    if (!id) return;
    const atual = lista.find((i) => i.id === id);
    if (!atual || atual.status === status) return;

    const fd = new FormData();
    fd.set("id", id);
    fd.set("psy_id", psyId);
    fd.set("status", status);
    fd.set("position", String(porEtapa.get(status)?.length ?? 0));
    startTransition(() => {
      moverOtimista({ id, status });
      void reorderAction(fd);
    });
  };

  const itemAberto = lista.find((i) => i.id === aberto) ?? null;

  return (
    <>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-4">
        {CONTENT_STATUS.map((col) => {
          const cards = porEtapa.get(col.key) ?? [];
          const cor = COL_COR[col.key];
          const destacado = alvo === col.key;
          const precisaAtencao = col.key === "revisao" && cards.length > 0;

          return (
            <section
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(col.key);
              }}
              onDragLeave={() => setAlvo((a) => (a === col.key ? null : a))}
              onDrop={(e) => {
                e.preventDefault();
                soltar(col.key);
              }}
              className={`flex w-[262px] shrink-0 flex-col rounded-2xl border transition-colors ${
                destacado ? "border-brand bg-brand/5" : `border-border ${cor.fundo}`
              }`}
            >
              <div className="rounded-t-2xl" style={{ borderTop: `3px solid ${cor.barra}` }} />
              <header className="flex items-center justify-between gap-2 px-3 pb-2 pt-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold uppercase tracking-wide text-heading">
                    {col.label}
                  </p>
                  <p className="truncate text-[11px] text-foreground-muted">{col.hint}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${cor.chip}`}>
                  {cards.length}
                </span>
              </header>

              {precisaAtencao && (
                <p className="mx-2 mb-2 flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2 py-1.5 text-[11px] font-medium text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Esperando {psyNome?.split(" ")[0] || "o psicólogo"} responder
                </p>
              )}

              <div className="flex-1 space-y-2 px-2 pb-3">
                {cards.map((it) => (
                  <Card
                    key={it.id}
                    item={it}
                    onOpen={() => setAberto(it.id)}
                    onDragStart={() => setArrastando(it.id)}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/70 px-2 py-6 text-center text-[11px] text-foreground-muted">
                    {destacado ? "Solte aqui" : "Vazio"}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <Layers className="h-3.5 w-3.5" />
        Arraste os cards entre as colunas. Clique para abrir a peça, conversar e subir versões.
      </p>

      {itemAberto && (
        <ItemDrawer item={itemAberto} psyId={psyId} onClose={() => setAberto(null)} />
      )}
    </>
  );
}

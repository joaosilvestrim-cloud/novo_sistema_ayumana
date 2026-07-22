"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, Upload, Trash2, ExternalLink, Send, ImageOff, Check, Sparkles, History, Hand,
} from "lucide-react";
import { CONTENT_STATUS, CONTENT_FORMAT_LABEL, type ContentFormat } from "@/lib/types";
import type { ItemDetail } from "@/lib/studio";
import {
  moveStatusAction, updateItemAction, uploadAssetAction, deleteItemAction,
  setDetailsAction, studioCommentAction, markStudioSeenAction,
} from "@/app/estudio/actions";
import { Conversa } from "@/components/studio/conversa";

const FORMATS: ContentFormat[] = ["post", "story", "reel", "carrossel", "outro"];
const campo = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand";
const rotulo = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground-muted";

export function ItemDrawer({
  item,
  psyId,
  onClose,
}: {
  item: ItemDetail;
  psyId: string;
  onClose: () => void;
}) {
  const [aba, setAba] = useState<"conversa" | "detalhes">("conversa");
  const marcado = useRef(false);

  // Abrir a peça já marca as mensagens do psicólogo como lidas.
  useEffect(() => {
    if (marcado.current || item.novasParaEstudio === 0) return;
    marcado.current = true;
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("psy_id", psyId);
    void markStudioSeenAction(fd);
  }, [item.id, item.novasParaEstudio, psyId]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const capa = item.versions[0]?.url ?? item.asset_url;
  const proxima = CONTENT_STATUS[CONTENT_STATUS.findIndex((s) => s.key === item.status) + 1];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border bg-background shadow-2xl"
      >
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-heading">{item.title}</h2>
              {item.requested_by && (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">
                  <Hand className="h-3 w-3" /> pedida pelo psicólogo
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-foreground-muted">
              {CONTENT_FORMAT_LABEL[item.format]}
              {item.versions.length > 0 && ` · ${item.versions.length} versão(ões)`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Etapa e avanço rápido */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-muted/50 p-3">
          <form action={moveStatusAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="psy_id" value={psyId} />
            <select
              name="status"
              defaultValue={item.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm font-medium"
            >
              {CONTENT_STATUS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </form>
          {proxima && (
            <form action={moveStatusAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="psy_id" value={psyId} />
              <input type="hidden" name="status" value={proxima.key} />
              <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                <Check className="h-4 w-4" /> Avançar para {proxima.label.toLowerCase()}
              </button>
            </form>
          )}
        </div>

        {/* Arte */}
        <div className="border-b border-border p-4">
          <div className="flex gap-3">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
              {capa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={capa} alt={item.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-foreground-muted">
                  <ImageOff className="h-5 w-5" />
                  <span className="text-[11px]">sem arte</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <form action={uploadAssetAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="psy_id" value={psyId} />
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand/50 bg-brand/5 py-3 text-sm font-medium text-brand-dark hover:bg-brand/10">
                  <Upload className="h-4 w-4" />
                  {item.versions.length ? `Subir versão ${item.versions[0].version + 1}` : "Subir a arte"}
                  <input
                    type="file"
                    name="asset"
                    accept="image/*,video/*,application/pdf"
                    className="hidden"
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  />
                </label>
              </form>
              {capa && (
                <a
                  href={capa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-dark hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir em tamanho real
                </a>
              )}
            </div>
          </div>

          {item.versions.length > 1 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                <History className="h-3.5 w-3.5" /> Histórico de versões
              </p>
              <div className="flex flex-wrap gap-2">
                {item.versions.map((v) => (
                  <a
                    key={v.id}
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative h-14 w-14 overflow-hidden rounded-lg border border-border"
                    title={`Versão ${v.version} — ${new Date(v.created_at).toLocaleDateString("pt-BR")}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.url} alt={`v${v.version}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-black/65 px-1 text-[10px] font-bold text-white">
                      v{v.version}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Abas */}
        <div className="flex border-b border-border">
          {(["conversa", "detalhes"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setAba(k)}
              className={`relative flex-1 py-2.5 text-sm font-medium capitalize ${
                aba === k ? "text-brand-dark" : "text-foreground-muted hover:text-heading"
              }`}
            >
              {k}
              {k === "conversa" && item.comments.length > 0 && (
                <span className="ml-1 text-xs text-foreground-muted">({item.comments.length})</span>
              )}
              {aba === k && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {aba === "conversa" ? (
            <div className="flex h-full flex-col">
              <Conversa comments={item.comments} meuLado="estudio" />
              <form action={studioCommentAction} className="border-t border-border p-3">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="psy_id" value={psyId} />
                <div className="flex items-end gap-2">
                  <textarea
                    name="body"
                    rows={2}
                    required
                    placeholder="Escreva para o psicólogo..."
                    className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5 p-4">
              <form action={updateItemAction} className="space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="psy_id" value={psyId} />
                <div>
                  <label className={rotulo}>Título</label>
                  <input name="title" defaultValue={item.title} className={campo} />
                </div>
                <div>
                  <label className={rotulo}>Formato</label>
                  <select name="format" defaultValue={item.format} className={campo}>
                    {FORMATS.map((f) => <option key={f} value={f}>{CONTENT_FORMAT_LABEL[f]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={rotulo}>Briefing / tema</label>
                  <textarea name="brief" defaultValue={item.brief ?? ""} rows={3} className={campo} />
                </div>
                <button className="h-9 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                  Salvar
                </button>
              </form>

              <form action={setDetailsAction} className="space-y-3 border-t border-border pt-4">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="psy_id" value={psyId} />
                <div>
                  <label className={rotulo}>Prazo combinado</label>
                  <input type="date" name="due_date" defaultValue={item.due_date ?? ""} className={campo} />
                </div>
                <div>
                  <label className={rotulo}>Legenda pronta</label>
                  <textarea
                    name="caption"
                    defaultValue={item.caption ?? ""}
                    rows={4}
                    placeholder="O texto que o psicólogo vai copiar e colar na publicação"
                    className={campo}
                  />
                </div>
                <div>
                  <label className={rotulo}>Hashtags</label>
                  <input
                    name="hashtags"
                    defaultValue={item.hashtags ?? ""}
                    placeholder="#terapia #saudemental"
                    className={campo}
                  />
                </div>
                <button className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-semibold hover:bg-surface-muted">
                  <Sparkles className="h-4 w-4" /> Salvar entrega
                </button>
              </form>

              <form action={deleteItemAction} className="border-t border-border pt-4">
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="psy_id" value={psyId} />
                <button
                  onClick={(e) => { if (!confirm("Excluir esta peça? A conversa e as versões vão junto.")) e.preventDefault(); }}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-danger/40 text-sm font-medium text-danger hover:bg-danger/10"
                >
                  <Trash2 className="h-4 w-4" /> Excluir peça
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

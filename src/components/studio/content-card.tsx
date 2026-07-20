"use client";

import { useState } from "react";
import { Pencil, Upload, Trash2, ExternalLink, ChevronDown } from "lucide-react";
import type { ContentItem } from "@/lib/types";
import { CONTENT_STATUS, CONTENT_FORMAT_LABEL } from "@/lib/types";
import { moveStatusAction, updateItemAction, uploadAssetAction, deleteItemAction } from "@/app/estudio/actions";

const FORMATS = ["post", "story", "reel", "carrossel", "outro"] as const;

export function ContentCard({ item, psyId }: { item: ContentItem; psyId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
      {item.asset_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.asset_url} alt={item.title} className="mb-2 h-24 w-full rounded-lg object-cover" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-heading">{item.title}</p>
          <p className="text-[11px] text-foreground-muted">{CONTENT_FORMAT_LABEL[item.format]}</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted" title="Editar">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* mover status */}
      <form action={moveStatusAction} className="mt-2">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="psy_id" value={psyId} />
        <select name="status" defaultValue={item.status} onChange={(e) => e.currentTarget.form?.requestSubmit()} className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs">
          {CONTENT_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </form>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {/* editar dados */}
          <form action={updateItemAction} className="space-y-2">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="psy_id" value={psyId} />
            <input name="title" defaultValue={item.title} placeholder="Título" className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs" />
            <select name="format" defaultValue={item.format} className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs">
              {FORMATS.map((f) => <option key={f} value={f}>{CONTENT_FORMAT_LABEL[f]}</option>)}
            </select>
            <textarea name="brief" defaultValue={item.brief ?? ""} placeholder="Briefing / tema" rows={2} className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
            <textarea name="feedback" defaultValue={item.feedback ?? ""} placeholder="Feedback do psicólogo / ajustes" rows={2} className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs" />
            <button className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md bg-primary text-xs font-medium text-primary-foreground hover:bg-primary-hover">
              <Pencil className="h-3.5 w-3.5" /> Salvar
            </button>
          </form>

          {/* upload da arte */}
          <form action={uploadAssetAction}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="psy_id" value={psyId} />
            <label className="flex cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-xs text-foreground-muted hover:bg-surface-muted">
              <Upload className="h-3.5 w-3.5" /> {item.asset_url ? "Trocar arte" : "Enviar arte"}
              <input type="file" name="asset" accept="image/*,video/*,application/pdf" className="hidden" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
            </label>
          </form>

          <div className="flex items-center justify-between">
            {item.asset_url ? (
              <a href={item.asset_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-dark hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> Ver arte
              </a>
            ) : <span />}
            <form action={deleteItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="psy_id" value={psyId} />
              <button className="inline-flex items-center gap-1 text-xs text-danger hover:underline" onClick={(e) => { if (!confirm("Excluir esta peça?")) e.preventDefault(); }}>
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

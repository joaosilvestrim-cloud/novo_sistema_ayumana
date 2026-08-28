"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

function LinkRow({ label, url }: { label: string; url: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* clipboard pode falhar em alguns navegadores */
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-heading">{label}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-foreground-muted" title={url}>{url}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-heading hover:bg-surface-muted"
      >
        {copiado ? <><Check className="h-4 w-4 text-green-600" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar</>}
      </button>
    </div>
  );
}

/** Links da campanha já marcados com a origem, para o time colar no canal certo. */
export function CampaignLinks({ site }: { site: string }) {
  const base = site.replace(/\/$/, "");
  return (
    <div className="space-y-2">
      <LinkRow label="Mandar no WhatsApp" url={`${base}/esqueci-senha?origem=whatsapp`} />
      <LinkRow label="Mandar por e-mail" url={`${base}/esqueci-senha?origem=email`} />
    </div>
  );
}

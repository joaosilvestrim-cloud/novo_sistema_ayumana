"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Copy, Check, AlertCircle, MessageCircle } from "lucide-react";
import { generatePresencaChargeAction } from "@/app/admin/presenca/actions";

export function PresencaCharge({ id, checkoutUrl, phone, name, removed }: { id: string; checkoutUrl: string | null; phone: string | null; name: string | null; removed?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(checkoutUrl);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function gerar() {
    setLoading(true);
    setErr(null);
    const fd = new FormData();
    fd.set("id", id);
    const res = await generatePresencaChargeAction(fd);
    setLoading(false);
    if (res.ok) {
      setUrl(res.checkoutUrl ?? null);
      router.refresh();
    } else {
      setErr(res.error ?? "Falha ao gerar a cobrança.");
    }
  }

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard pode falhar */
    }
  };

  const waText = url && phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá${name ? `, ${name}` : ""}! Aqui está o link para ativar o seu plano Presença na Ayumana: ${url}`)}`
    : null;

  if (url) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-dark hover:underline">Abrir cobrança</a>
          <button onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted">
            {copied ? <><Check className="h-3 w-3 text-green-600" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar link</>}
          </button>
        </div>
        {waText && (
          <a href={waText} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#1ebe5b] hover:underline">
            <MessageCircle className="h-3.5 w-3.5" /> Enviar no WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={gerar} disabled={loading} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/50 px-3 text-xs font-medium text-brand-dark hover:bg-brand/10 disabled:opacity-60">
        {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando…</> : <><CreditCard className="h-3.5 w-3.5" /> {removed ? "Gerar nova cobrança" : "Gerar cobrança e link"}</>}
      </button>
      {err && (
        <span className="inline-flex max-w-60 items-start gap-1 text-right text-xs text-danger">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {err}
        </span>
      )}
    </div>
  );
}

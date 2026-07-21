"use client";

import { useState, useTransition } from "react";
import { LifeBuoy, X, MessageCircle } from "lucide-react";
import { requestSupportAction } from "@/app/painel/suporte/actions";

export function SupportButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const abrirWhatsapp = () => {
    start(async () => {
      const { whatsappUrl } = await requestSupportAction(msg);
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setOpen(false);
      setMsg("");
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-muted hover:text-heading"
            : "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted"
        }
        title="Falar com o suporte"
      >
        <LifeBuoy className="h-4 w-4 shrink-0" />
        Ajuda
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div>
                <p className="font-semibold text-heading">Precisa de ajuda?</p>
                <p className="mt-0.5 text-sm text-foreground-muted">
                  Nosso time responde pelo WhatsApp em horário comercial.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-foreground-muted hover:bg-surface-muted"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label htmlFor="suporte-msg" className="mb-1.5 block text-sm font-medium text-heading">
                  Conte rapidinho o que você precisa <span className="font-normal text-foreground-muted">(opcional)</span>
                </label>
                <textarea
                  id="suporte-msg"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Ex.: não consigo enviar meu documento do CRP"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <p className="mt-1 text-xs text-foreground-muted">
                  Já abrimos o WhatsApp com essa mensagem escrita, e avisamos o time por e-mail.
                </p>
              </div>

              <button
                onClick={abrirWhatsapp}
                disabled={pending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
              >
                <MessageCircle className="h-4 w-4" />
                {pending ? "Abrindo..." : "Falar no WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

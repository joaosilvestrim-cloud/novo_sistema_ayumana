"use client";

import { useState } from "react";
import { Link2, Check, Share2 } from "lucide-react";

/** Botões para o próprio psicólogo (ou qualquer pessoa) compartilhar o perfil. */
export function ShareProfile({
  slug,
  name,
  variant = "inline",
}: {
  slug: string;
  name: string | null;
  variant?: "inline" | "card";
}) {
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://ayumana.com.br";
    return `${origin}/psicologo/${slug}`;
  };

  const shareText = `${name ? `Conheça ${name} na Ayumana` : "Veja este perfil na Ayumana"} — terapia em português.`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const onNativeShare = async () => {
    const url = buildUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name ?? "Ayumana", text: shareText, url });
      } catch {
        /* cancelado */
      }
    } else {
      onCopy();
    }
  };

  const waHref = () =>
    `https://wa.me/?text=${encodeURIComponent(`${shareText} ${buildUrl()}`)}`;

  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg">Compartilhe seu perfil</h2>
        </div>
        <p className="mt-1 text-sm text-foreground-muted">
          Divulgue seu link nas redes e no WhatsApp. Ao compartilhar, aparece um
          card com a sua foto.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-foreground-muted" />
          <span className="truncate text-sm text-foreground-muted">{buildUrl()}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onCopy}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-heading hover:bg-surface-muted"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar link"}
          </button>
          <a
            href={waHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-medium text-white hover:bg-[#1ebe5b]"
          >
            Compartilhar no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={onNativeShare}
        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-heading hover:bg-surface-muted"
      >
        <Share2 className="h-4 w-4" /> Compartilhar
      </button>
      <button
        onClick={onCopy}
        aria-label="Copiar link"
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border hover:bg-surface-muted"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

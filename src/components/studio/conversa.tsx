"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, RefreshCw, Info } from "lucide-react";
import type { ContentComment } from "@/lib/types";

const ICONE = {
  aprovacao: CheckCircle2,
  ajuste: RefreshCw,
  sistema: Info,
} as const;

function quando(iso: string): string {
  const d = new Date(iso);
  const min = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.floor(min / 60)}h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Conversa da peça. Os dois lados falam aqui, e os marcos (aprovação, pedido
 * de ajuste, nova versão) entram na mesma linha do tempo, para que a decisão
 * fique junto do motivo dela.
 */
export function Conversa({
  comments,
  meuLado,
}: {
  comments: ContentComment[];
  meuLado: "psicologo" | "estudio";
}) {
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [comments.length]);

  if (comments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-foreground-muted">
        Nenhuma mensagem ainda. O que for combinado aqui fica registrado na peça.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {comments.map((c) => {
        const meu = c.author_side === meuLado;
        const marco = c.kind !== "mensagem";
        const Icone = marco ? (ICONE[c.kind as keyof typeof ICONE] ?? Info) : null;

        // Marcos ficam centralizados, como uma linha do tempo.
        if (marco) {
          const cor =
            c.kind === "aprovacao"
              ? "bg-lime-50 text-lime-800 border-lime-200"
              : c.kind === "ajuste"
                ? "bg-orange-50 text-orange-800 border-orange-200"
                : "bg-surface-muted text-foreground-muted border-border";
          return (
            <div key={c.id} className="flex justify-center">
              <div className={`flex max-w-[92%] items-start gap-2 rounded-lg border px-3 py-2 text-[13px] ${cor}`}>
                {Icone && <Icone className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                <p className="leading-snug">
                  <strong className="font-semibold">{c.author_name || (c.author_side === "estudio" ? "Estúdio" : "Psicólogo")}</strong>{" "}
                  {c.body}
                  <span className="ml-1.5 opacity-70">· {quando(c.created_at)}</span>
                </p>
              </div>
            </div>
          );
        }

        return (
          <div key={c.id} className={`flex ${meu ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  meu
                    ? "rounded-br-md bg-brand-dark text-white"
                    : "rounded-bl-md border border-border bg-surface-muted text-heading"
                }`}
              >
                {!meu && (
                  <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                    {c.author_name || (c.author_side === "estudio" ? "Estúdio" : "Psicólogo")}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{c.body}</p>
              </div>
              <p className={`mt-0.5 text-[11px] text-foreground-muted ${meu ? "text-right" : ""}`}>
                {quando(c.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={fim} />
    </div>
  );
}

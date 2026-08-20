"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGESTOES = [
  "O que é a Ayumana?",
  "Quais são os planos e preços?",
  "Como funciona a verificação de CRP?",
  "Quero falar com a equipe",
];

const OLA: Msg = {
  role: "assistant",
  content: "Oi! Eu sou a Aya, a assistente da Ayumana. 💚 Posso tirar dúvidas sobre a plataforma, os planos e como completar seu perfil. Como posso ajudar?",
};

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([OLA]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dica, setDica] = useState(true);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading, open]);

  // Não aparece nas áreas internas de equipe.
  if (pathname.startsWith("/admin") || pathname.startsWith("/estudio")) return null;

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || loading) return;
    setDica(false);
    const novo = [...msgs, { role: "user" as const, content: t }];
    setMsgs(novo);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: novo }),
      });
      const data = await res.json();
      // O detalhe técnico só aparece enquanto estamos ajustando a integração.
      const reply = (data.reply || "Desculpa, não consegui responder.") + (data.error ? `\n\n⚠️ ${data.error}` : "");
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Tive um problema de conexão. Tenta de novo?" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botão flutuante com a mascote */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
          {dica && (
            <button
              onClick={() => setOpen(true)}
              className="max-w-[220px] rounded-2xl rounded-br-sm border border-border bg-background px-3.5 py-2 text-left text-sm text-heading shadow-lg animate-[aya-in_.3s_ease]"
            >
              Oi! Ficou com alguma dúvida? Fala comigo. 💚
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir assistente"
            className="group relative h-20 w-20 transition-transform hover:scale-105"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/mascote.png"
              alt="Aya"
              className="h-full w-full object-contain [filter:drop-shadow(0_4px_8px_rgba(0,0,0,0.22))] [animation:aya-float_4s_ease-in-out_infinite]"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/brand/ayumana-symbol.png"; }}
            />
            <span className="absolute right-2.5 top-3.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#73A533]" />
          </button>
        </div>
      )}

      {/* Painel do chat */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[min(560px,80vh)] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl animate-[aya-in_.25s_ease]">
          {/* Cabeçalho */}
          <div className="flex items-center gap-3 bg-[#05474A] px-4 py-3 text-white">
            <div className="relative h-11 w-11 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/mascote.png"
                alt="Aya"
                className="h-full w-full object-contain [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.3))]"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/brand/ayumana-symbol.png"; }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Aya</p>
              <p className="flex items-center gap-1 text-xs text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8ED04F]" /> Assistente da Ayumana
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-full p-1.5 text-white/80 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F1F5F3] px-4 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[82%] rounded-2xl rounded-br-sm bg-[#73A533] px-3.5 py-2 text-sm leading-relaxed text-white"
                      : "max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-border bg-background px-3.5 py-2 text-sm leading-relaxed text-heading"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-foreground-muted" />
                </div>
              </div>
            )}

            {/* Sugestões iniciais */}
            {msgs.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviar(s)}
                    className="rounded-full border border-brand/40 bg-background px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-brand/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {/* Entrada */}
          <form
            onSubmit={(e) => { e.preventDefault(); enviar(input); }}
            className="flex items-center gap-2 border-t border-border bg-background px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua dúvida…"
              className="h-10 flex-1 rounded-full border border-border bg-surface-muted px-4 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#73A533] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="flex items-center justify-center gap-1 bg-background pb-2 text-[10px] text-foreground-muted">
            <Sparkles className="h-3 w-3" /> A Aya usa IA e pode errar. Confirme o que for importante.
          </p>
        </div>
      )}
    </>
  );
}

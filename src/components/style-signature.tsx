"use client";

import { useEffect, useRef, useState } from "react";
import { STYLE_SPECTRUMS, styleValue, type Style } from "@/lib/style";

// Palavra-chave por espectro conforme a posição.
const KEYWORDS: Record<string, [string, string]> = {
  direcao: ["Escuta ativa", "Direcionadora"],
  estrutura: ["Flexível", "Estruturada"],
  tom: ["Acolhedora", "Provocadora"],
  foco: ["Foco emocional", "Foco prático"],
  registro: ["Linguagem simples", "Técnica"],
};

function tagsFrom(style: Style | null | undefined): string[] {
  const out: string[] = [];
  for (const s of STYLE_SPECTRUMS) {
    const v = styleValue(style, s.key);
    const kw = KEYWORDS[s.key];
    if (!kw) continue;
    if (v <= 38) out.push(kw[0]);
    else if (v >= 62) out.push(kw[1]);
  }
  return out;
}

function interpret(key: string, v: number, left: string, right: string): string {
  if (v <= 38) return `Mais ${left.toLowerCase()}`;
  if (v >= 62) return `Mais ${right.toLowerCase()}`;
  return `Equilíbrio entre ${left.toLowerCase()} e ${right.toLowerCase()}`;
}

export function StyleSignature({
  style,
  firstName,
}: {
  style: Style | null;
  firstName?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Anima ao entrar na viewport.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tags = tagsFrom(style);

  return (
    <section ref={ref}>
      <h2 className="text-lg">Meu estilo de atendimento</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Como costuma ser a sessão com {firstName || "este profissional"}. Passe o
        mouse ou toque em cada linha.
      </p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {STYLE_SPECTRUMS.map((s) => {
          const v = styleValue(style, s.key);
          const isActive = active === s.key;
          return (
            <div
              key={s.key}
              onMouseEnter={() => setActive(s.key)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive((a) => (a === s.key ? null : s.key))}
              className={`cursor-default rounded-xl border p-3 transition-colors ${
                isActive ? "border-brand bg-brand/5" : "border-border"
              }`}
            >
              <div className="mb-2 flex justify-between text-xs font-medium text-foreground-muted">
                <span>{s.left}</span>
                <span>{s.right}</span>
              </div>
              <div className="relative h-2 rounded-full bg-gradient-to-r from-teal-100 via-neutral-100 to-green-100">
                <div
                  className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand shadow-md transition-all duration-700 ease-out"
                  style={{ left: `${mounted ? v : 50}%` }}
                />
              </div>
              <p
                className={`mt-2 text-xs text-brand-dark transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0 h-0 mt-0 overflow-hidden"
                }`}
              >
                {interpret(s.key, v, s.left, s.right)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

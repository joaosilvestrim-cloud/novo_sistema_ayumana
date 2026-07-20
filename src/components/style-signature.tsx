"use client";

import { useEffect, useRef, useState } from "react";
import { STYLE_SPECTRUMS, styleValue, styleTag, styleReading, type Style } from "@/lib/style";

const N = 7; // blocos por linha (ímpar → bloco central de equilíbrio)
const CENTER = 3;

function tagsFrom(style: Style | null | undefined): string[] {
  const out: string[] = [];
  for (const s of STYLE_SPECTRUMS) {
    const t = styleTag(s, styleValue(style, s.key));
    if (t) out.push(t);
  }
  return out;
}

// Estado de cada bloco: acende do centro em direção ao polo dominante.
function blockKind(v: number, i: number): "left" | "right" | "center" | null {
  if (i === CENTER) return "center";
  if (i > CENTER) {
    const pos = 50 + ((i - CENTER) / (N - 1 - CENTER)) * 50; // 66.7 / 83.3 / 100
    return v >= pos ? "right" : null;
  }
  const pos = 50 - ((CENTER - i) / CENTER) * 50; // 33.3 / 16.7 / 0
  return v <= pos ? "left" : null;
}

export function StyleSignature({
  style,
  firstName,
}: {
  style: Style | null;
  firstName?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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
        Como costuma ser a sessão com {firstName || "este profissional"}. Toque ou
        passe o mouse em cada linha.
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

      <div className="mt-5 space-y-2">
        {STYLE_SPECTRUMS.map((s, idx) => {
          const v = styleValue(style, s.key);
          const isActive = active === idx;
          return (
            <button
              key={s.key}
              type="button"
              onMouseEnter={() => setActive(idx)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(idx)}
              onClick={() => setActive((a) => (a === idx ? null : idx))}
              className={`block w-full rounded-xl border p-3 text-left transition-colors ${
                isActive ? "border-brand bg-brand/5" : "border-transparent hover:bg-surface-muted/50"
              }`}
            >
              <div className="mb-1.5 flex justify-between text-xs font-medium">
                <span className={v <= 30 ? "text-brand-dark" : "text-foreground-muted"}>{s.left}</span>
                <span className={v >= 70 ? "text-brand-dark" : "text-foreground-muted"}>{s.right}</span>
              </div>

              {/* Equalizer de blocos */}
              <div className="flex items-center gap-1">
                {Array.from({ length: N }).map((_, i) => {
                  const kind = blockKind(v, i);
                  const lit = kind !== null;
                  const color =
                    kind === "right" ? "bg-brand" : kind === "left" ? "bg-teal-500" : "bg-heading/40";
                  // distância do centro define o atraso da animação (efeito equalizer)
                  const delay = Math.abs(i - CENTER) * 70;
                  return (
                    <div key={i} className="relative h-4 flex-1 overflow-hidden rounded-[3px] bg-surface-muted">
                      {lit && (
                        <div
                          className={`absolute inset-0 ${color} transition-all duration-300 ease-out`}
                          style={{
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "scaleY(1)" : "scaleY(0.3)",
                            transitionDelay: `${delay}ms`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <p
                className={`mt-1.5 text-xs transition-colors ${
                  isActive ? "font-medium text-brand-dark" : "text-foreground-muted"
                }`}
              >
                {styleReading(s, v)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

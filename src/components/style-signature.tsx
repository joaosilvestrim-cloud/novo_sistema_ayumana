"use client";

import { useEffect, useRef, useState } from "react";
import { STYLE_SPECTRUMS, styleValue, styleTag, styleReading, type Style } from "@/lib/style";

function tagsFrom(style: Style | null | undefined): string[] {
  const out: string[] = [];
  for (const s of STYLE_SPECTRUMS) {
    const t = styleTag(s, styleValue(style, s.key));
    if (t) out.push(t);
  }
  return out;
}

export function StyleSignature({
  style,
  firstName,
}: {
  style: Style | null;
  firstName?: string | null;
}) {
  const [mounted, setMounted] = useState(false);
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
        Como costuma ser a sessão com {firstName || "este profissional"}. Cada barra
        pende para o lado que predomina.
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

      <div className="mt-5 space-y-5">
        {STYLE_SPECTRUMS.map((s) => {
          const v = styleValue(style, s.key);
          const target = mounted ? v : 50;
          const right = target > 50;
          // Segmento preenchido do centro (50%) até o valor.
          const fillLeft = right ? 50 : target;
          const fillWidth = Math.abs(target - 50);
          return (
            <div key={s.key}>
              <div className="mb-1.5 flex justify-between text-xs font-medium">
                <span className={!right && Math.abs(v - 50) >= 12 ? "text-brand-dark" : "text-foreground-muted"}>
                  {s.left}
                </span>
                <span className={right && Math.abs(v - 50) >= 12 ? "text-brand-dark" : "text-foreground-muted"}>
                  {s.right}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-surface-muted">
                {/* linha central (equilíbrio) */}
                <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
                {/* preenchimento divergente a partir do centro */}
                <div
                  className={`absolute top-0 h-full rounded-full transition-all duration-700 ease-out ${
                    right ? "bg-brand" : "bg-teal-500"
                  }`}
                  style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
                />
                {/* marcador na posição do valor */}
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-heading shadow transition-all duration-700 ease-out"
                  style={{ left: `${target}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-foreground-muted">{styleReading(s, v)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

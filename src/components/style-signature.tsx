"use client";

import { useEffect, useRef, useState } from "react";
import { styleValue, type Style } from "@/lib/style";

// Eixos do radar. `short` é o rótulo curto no vértice; left/right são os polos.
const AXES = [
  { key: "direcao", short: "Direção", left: "Escuta livre", right: "Direcionamento" },
  { key: "estrutura", short: "Estrutura", left: "Sessão flexível", right: "Sessão estruturada" },
  { key: "tom", short: "Provocação", left: "Acolhedor", right: "Provocador" },
  { key: "foco", short: "Praticidade", left: "Foco nas emoções", right: "Foco em estratégias" },
  { key: "registro", short: "Formalidade", left: "Informal", right: "Técnico" },
];

const KEYWORDS: Record<string, [string, string]> = {
  direcao: ["Escuta ativa", "Direcionadora"],
  estrutura: ["Flexível", "Estruturada"],
  tom: ["Acolhedora", "Provocadora"],
  foco: ["Foco emocional", "Foco prático"],
  registro: ["Linguagem simples", "Técnica"],
};

function tagsFrom(style: Style | null | undefined): string[] {
  const out: string[] = [];
  for (const a of AXES) {
    const v = styleValue(style, a.key);
    const kw = KEYWORDS[a.key];
    if (!kw) continue;
    if (v <= 38) out.push(kw[0]);
    else if (v >= 62) out.push(kw[1]);
  }
  return out;
}

function interpret(v: number, left: string, right: string): string {
  if (v <= 38) return `Mais ${left.toLowerCase()}`;
  if (v >= 62) return `Mais ${right.toLowerCase()}`;
  return `Equilíbrio entre ${left.toLowerCase()} e ${right.toLowerCase()}`;
}

// Geometria do radar.
const CX = 160;
const CY = 148;
const R = 92;
const N = AXES.length;

function point(i: number, radius: number): [number, number] {
  const ang = (-90 + (360 / N) * i) * (Math.PI / 180);
  return [CX + radius * Math.cos(ang), CY + radius * Math.sin(ang)];
}
function polygon(radiusOf: (i: number) => number): string {
  return AXES.map((_, i) => point(i, radiusOf(i)).join(",")).join(" ");
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
  const ref = useRef<SVGSVGElement>(null);

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
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tags = tagsFrom(style);
  const dataPoly = polygon((i) => (styleValue(style, AXES[i].key) / 100) * R);

  return (
    <section>
      <h2 className="text-lg">Meu estilo de atendimento</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Um mapa de como costuma ser a sessão com {firstName || "este profissional"}.
        Toque ou passe o mouse em cada ponta.
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

      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[320px_1fr]">
        <svg ref={ref} viewBox="0 0 320 296" className="mx-auto w-full max-w-[320px]" role="img" aria-label="Radar do estilo de atendimento">
          {/* Anéis de referência */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <polygon
              key={f}
              points={polygon(() => f * R)}
              fill="none"
              stroke={f === 0.5 ? "#cbd5e1" : "#e5e7eb"}
              strokeDasharray={f === 0.5 ? "3 3" : undefined}
              strokeWidth="1"
            />
          ))}
          {/* Eixos */}
          {AXES.map((a, i) => {
            const [x, y] = point(i, R);
            return <line key={a.key} x1={CX} y1={CY} x2={x} y2={y} stroke="#e5e7eb" strokeWidth="1" />;
          })}
          {/* Área de dados (cresce do centro) */}
          <g
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: mounted ? "scale(1)" : "scale(0)",
              transition: "transform 800ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <polygon points={dataPoly} fill="#73A533" fillOpacity="0.18" stroke="#05474A" strokeWidth="2" strokeLinejoin="round" />
            {AXES.map((a, i) => {
              const v = styleValue(style, a.key);
              const [x, y] = point(i, (v / 100) * R);
              return (
                <circle
                  key={a.key}
                  cx={x}
                  cy={y}
                  r={active === i ? 6 : 4}
                  fill="#05474A"
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive((p) => (p === i ? null : i))}
                />
              );
            })}
          </g>
          {/* Rótulos dos vértices */}
          {AXES.map((a, i) => {
            const [x, y] = point(i, R + 20);
            const anchor = x < CX - 4 ? "end" : x > CX + 4 ? "start" : "middle";
            return (
              <text
                key={a.key}
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="fill-foreground-muted"
                fontSize="12"
                fontWeight={active === i ? 700 : 500}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onClick={() => setActive((p) => (p === i ? null : i))}
              >
                {a.short}
              </text>
            );
          })}
        </svg>

        {/* Leitura ao lado (ou embaixo no mobile) */}
        <div className="space-y-2">
          {AXES.map((a, i) => {
            const v = styleValue(style, a.key);
            const isActive = active === i;
            return (
              <button
                key={a.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onClick={() => setActive((p) => (p === i ? null : i))}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  isActive ? "border-brand bg-brand/5" : "border-border"
                }`}
              >
                <span className="font-medium text-heading">{a.short}</span>
                <span className="text-xs text-foreground-muted">{interpret(v, a.left, a.right)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

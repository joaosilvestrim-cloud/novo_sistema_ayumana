"use client";

import { useState } from "react";
import { Ear, CalendarDays, HeartHandshake, Heart, MessageCircle, BarChart3, Lightbulb } from "lucide-react";
import {
  STYLE_SPECTRUMS, styleValue, styleLean, styleIntensity, styleReading,
  type Style, type StyleIcon,
} from "@/lib/style";

const ICONS: Record<StyleIcon, React.ElementType> = {
  ear: Ear,
  calendar: CalendarDays,
  care: HeartHandshake,
  heart: Heart,
  chat: MessageCircle,
};

const TEAL = "#0e7490"; // polo esquerdo
const GREEN = "#4d7c0f"; // polo direito
const GREY = "#94a3b8";

// Geometria do radar (pentágono).
const CX = 150, CY = 140, R = 96, NAX = STYLE_SPECTRUMS.length;
function pt(i: number, radius: number): [number, number] {
  const a = (-90 + (360 / NAX) * i) * (Math.PI / 180);
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
}
function ring(level: number): string {
  return STYLE_SPECTRUMS.map((_, i) => pt(i, (level / 5) * R).join(",")).join(" ");
}

export function StyleSignature({ style, firstName }: { style: Style | null; firstName?: string | null }) {
  const [active, setActive] = useState<number | null>(null);

  const dims = STYLE_SPECTRUMS.map((s) => {
    const v = styleValue(style, s.key);
    return { s, v, lean: styleLean(v), intensity: styleIntensity(v) };
  });
  const dataPoly = dims.map((d, i) => pt(i, (d.intensity / 5) * R).join(",")).join(" ");

  return (
    <section>
      <h2 className="text-lg">Meu estilo de atendimento</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        Como costuma ser a sessão com {firstName || "este profissional"}. Cada eixo é uma
        preferência de atuação.
      </p>

      {/* Radar */}
      <div className="mt-4 flex justify-center">
        <svg viewBox="0 0 300 290" className="ayu-rise w-full max-w-[420px]" role="img" aria-label="Radar do estilo de atendimento">
          {/* anéis de referência */}
          {[1, 2, 3, 4, 5].map((lv) => (
            <polygon key={lv} points={ring(lv)} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          ))}
          {/* eixos */}
          {dims.map((_, i) => {
            const [x, y] = pt(i, R);
            return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
          })}
          {/* números 1..5 no eixo de cima */}
          {[1, 2, 3, 4, 5].map((lv) => (
            <text key={lv} x={CX + 5} y={CY - (lv / 5) * R + 3} fontSize="9" fill="#94a3b8">{lv}</text>
          ))}
          {/* área de dados */}
          <polygon points={dataPoly} fill="#14b8a6" fillOpacity="0.15" stroke="#0d9488" strokeWidth="2" strokeLinejoin="round" />
          {/* vértices + badge numerado */}
          {dims.map((d, i) => {
            const [x, y] = pt(i, (d.intensity / 5) * R);
            const [bx, by] = pt(i, R + 20);
            const color = d.lean === "left" ? TEAL : d.lean === "right" ? GREEN : GREY;
            const on = active === i;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={on ? 5 : 4} fill={color} stroke="#fff" strokeWidth="1.5" />
                <circle cx={bx} cy={by} r="11" fill="#fff" stroke={color} strokeWidth="1.5" />
                <text x={bx} y={by + 3.5} fontSize="11" fontWeight="600" fill={color} textAnchor="middle">{i + 1}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda: cada dimensão com os dois polos, descrição e o lado que predomina */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {dims.map((d, i) => {
          const Icon = ICONS[d.s.icon];
          const color = d.lean === "left" ? TEAL : d.lean === "right" ? GREEN : GREY;
          return (
            <div
              key={d.s.key}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              className={`rounded-xl border p-3 transition-colors ${active === i ? "border-brand bg-brand/5" : "border-border"}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ color, borderColor: color, borderWidth: 1.5 }}>
                  {i + 1}
                </span>
                <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                <span className="text-sm font-medium" style={{ color }}>{styleReading(d.s, d.v)}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className={d.lean === "left" ? "opacity-100" : "opacity-55"}>
                  <p className="font-medium" style={{ color: TEAL }}>{d.s.left}</p>
                  <p className="text-foreground-muted">{d.s.leftDesc}</p>
                </div>
                <div className={`text-right ${d.lean === "right" ? "opacity-100" : "opacity-55"}`}>
                  <p className="font-medium" style={{ color: GREEN }}>{d.s.right}</p>
                  <p className="text-foreground-muted">{d.s.rightDesc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rodapé explicativo */}
      <div className="mt-4 grid gap-4 rounded-2xl bg-surface-muted/50 p-4 sm:grid-cols-2">
        <div className="flex gap-3">
          <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
          <div>
            <p className="text-sm font-semibold text-heading">Como interpretar</p>
            <p className="text-xs text-foreground-muted">Quanto mais longe do centro, mais forte a tendência da dimensão. O centro indica equilíbrio entre os polos.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
          <div>
            <p className="text-sm font-semibold text-heading">Importante</p>
            <p className="text-xs text-foreground-muted">Não existe estilo melhor ou pior. Cada perfil é único e ajuda você a sentir o encaixe antes da primeira sessão.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Ear, CalendarDays, HeartHandshake, Heart, MessageCircle, Sparkles } from "lucide-react";
import {
  STYLE_SPECTRUMS, styleValue, styleLean, styleIntensity, type Style, type StyleIcon,
} from "@/lib/style";

const ICONS: Record<StyleIcon, React.ElementType> = {
  ear: Ear, calendar: CalendarDays, care: HeartHandshake, heart: Heart, chat: MessageCircle,
};

// Cores (gradiente) por dimensão e polo — dão a "aura" única de cada profissional.
const HUE: Record<string, { left: [string, string]; right: [string, string] }> = {
  direcao: { left: ["#2dd4bf", "#0e7490"], right: ["#4ade80", "#16a34a"] },
  estrutura: { left: ["#22d3ee", "#0891b2"], right: ["#34d399", "#059669"] },
  tom: { left: ["#38bdf8", "#0284c7"], right: ["#a3e635", "#65a30d"] },
  foco: { left: ["#5eead4", "#14b8a6"], right: ["#84cc16", "#4d7c0f"] },
  registro: { left: ["#7dd3fc", "#0ea5e9"], right: ["#86efac", "#4d7c0f"] },
};

// Falas que dão o "gostinho" da sessão, por polo.
const PHRASE: Record<string, { left: string; right: string }> = {
  direcao: { left: "Pode falar à vontade, estou aqui.", right: "Deixa que eu te trago uma direção." },
  estrutura: { left: "A gente vai no fluxo de hoje.", right: "Vamos seguir um plano para a sessão." },
  tom: { left: "Vamos com calma, no seu tempo.", right: "E se a gente olhar por outro ângulo?" },
  foco: { left: "Como você se sentiu com isso?", right: "Bora montar um passo prático?" },
  registro: { left: "Sem termos difíceis, combinado?", right: "Posso te explicar o conceito por trás." },
};

const ADJ: Record<string, [string, string]> = {
  direcao: ["Escuta ativa", "Direcionadora"],
  estrutura: ["Flexível", "Estruturada"],
  tom: ["Acolhedora", "Desafiadora"],
  foco: ["Sensível", "Prática"],
  registro: ["Acessível", "Técnica"],
};

type Dim = {
  s: (typeof STYLE_SPECTRUMS)[number];
  lean: "left" | "right" | "center";
  intensity: number;
  side: "left" | "right"; // polo dominante (center vira o mais próximo)
};

export function StyleSignature({
  style,
  firstName,
  attendanceTags = [],
}: {
  style: Style | null;
  firstName?: string | null;
  avatarUrl?: string | null;
  seed?: string;
  attendanceTags?: string[];
}) {
  const dims: Dim[] = STYLE_SPECTRUMS.map((s) => {
    const v = styleValue(style, s.key);
    const lean = styleLean(v);
    return { s, lean, intensity: styleIntensity(v), side: v >= 50 ? "right" : "left" };
  });

  // Ordena por intensidade — os traços mais marcantes lideram a cena.
  const strong = [...dims].sort((a, b) => b.intensity - a.intensity);
  const archetype = strong.slice(0, 2).map((d) => ADJ[d.s.key][d.side === "left" ? 0 : 1]).join(" e ");

  const [auto, setAuto] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setAuto((a) => (a + 1) % STYLE_SPECTRUMS.length), 3800);
    return () => clearInterval(id);
  }, []);

  // Dimensão ativa (hover manda; senão o carrossel entre os mais fortes).
  const activeDim = hover !== null ? dims[hover] : strong[auto % strong.length];
  const aColors = HUE[activeDim.s.key][activeDim.side];
  const phrase = PHRASE[activeDim.s.key][activeDim.side];

  return (
    <section>
      <h2 className="text-lg">Meu estilo de atendimento</h2>
      <p className="mt-1 text-sm text-foreground-muted">
        A aura de {firstName || "este profissional"} muda com o estilo. Toque nos traços.
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-background to-accent/5">
        {/* Palco da aura + cena */}
        <div className="relative h-60 overflow-hidden">
          {/* aura (2 blobs orgânicos animados) */}
          <div
            className="aura-blob absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 blur-[2px] transition-[background] duration-700"
            style={{ background: `linear-gradient(135deg, ${aColors[0]}, ${aColors[1]})`, opacity: 0.9 }}
          />
          <div
            className="aura-blob-2 absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply blur-[1px] transition-[background] duration-700"
            style={{ background: `linear-gradient(300deg, ${aColors[1]}, ${aColors[0]})`, opacity: 0.55 }}
          />
          <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 backdrop-blur-sm" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-heading shadow">
            <Sparkles className="h-6 w-6" style={{ color: aColors[1] }} />
          </div>

          {/* balão da cena (troca com a dimensão ativa) */}
          <div key={`${activeDim.s.key}-${activeDim.side}`} className="ayu-rise absolute right-3 top-3 max-w-[62%] rounded-2xl rounded-tr-sm border border-border bg-background/95 px-3 py-2 shadow-md backdrop-blur">
            <p className="text-[11px] font-medium" style={{ color: aColors[1] }}>
              {ADJ[activeDim.s.key][activeDim.side === "left" ? 0 : 1]}
            </p>
            <p className="text-sm text-heading">“{phrase}”</p>
          </div>
          <div className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-brand-dark shadow-sm backdrop-blur">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> {archetype}</span>
          </div>
        </div>

        {/* traços interativos */}
        <div className="flex flex-wrap gap-2 border-t border-border/70 p-4">
          {dims.map((d, i) => {
            const Icon = ICONS[d.s.icon];
            const isOn = (hover === null ? strong[auto % strong.length].s.key === d.s.key : hover === i);
            const c = HUE[d.s.key][d.side][1];
            return (
              <button
                key={d.s.key}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onClick={() => setHover((h) => (h === i ? null : i))}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  borderColor: isOn ? c : "var(--border)",
                  backgroundColor: isOn ? `${c}18` : "transparent",
                  color: isOn ? c : "var(--foreground-muted)",
                }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: c }} />
                {ADJ[d.s.key][d.side === "left" ? 0 : 1]}
              </button>
            );
          })}
        </div>

        {attendanceTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/70 px-4 py-3">
            <span className="text-xs font-medium text-foreground-muted">Atende:</span>
            {attendanceTags.map((t) => (
              <span key={t} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-heading">{t}</span>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 px-1 text-xs text-foreground-muted">
        Uma leitura do estilo entre dois polos. Não existe melhor ou pior — ajuda você a
        sentir o encaixe antes da primeira sessão.
      </p>
    </section>
  );
}

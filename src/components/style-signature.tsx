"use client";

import { useState } from "react";
import { Ear, CalendarDays, HeartHandshake, Heart, MessageCircle, Sparkles } from "lucide-react";
import { AvatarBubble } from "@/components/ui/avatar-bubble";
import {
  STYLE_SPECTRUMS, styleValue, styleLean, styleIntensity, styleReading,
  type Style, type StyleIcon,
} from "@/lib/style";

const ICONS: Record<StyleIcon, React.ElementType> = {
  ear: Ear, calendar: CalendarDays, care: HeartHandshake, heart: Heart, chat: MessageCircle,
};

// Adjetivo curto por polo, para montar o "arquétipo".
const ADJ: Record<string, [string, string]> = {
  direcao: ["Escuta ativa", "Direcionadora"],
  estrutura: ["Flexível", "Estruturada"],
  tom: ["Acolhedora", "Desafiadora"],
  foco: ["Sensível", "Prática"],
  registro: ["Acessível", "Técnica"],
};

const TEAL = "#0e7490";
const GREEN = "#4d7c0f";

type Dim = {
  s: (typeof STYLE_SPECTRUMS)[number];
  v: number;
  lean: "left" | "right" | "center";
  intensity: number;
};

function archetype(dims: Dim[]): string {
  const leaning = dims.filter((d) => d.lean !== "center").sort((a, b) => b.intensity - a.intensity);
  const adjs = leaning.slice(0, 2).map((d) => ADJ[d.s.key][d.lean === "left" ? 0 : 1]);
  if (adjs.length === 0) return "Equilibrada e versátil";
  if (adjs.length === 1) return adjs[0];
  return `${adjs[0]} e ${adjs[1]}`;
}

function Pips({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-1.5 w-4 rounded-full"
          style={{ backgroundColor: i < level ? color : "#e2e8f0" }}
        />
      ))}
    </div>
  );
}

export function StyleSignature({
  style,
  firstName,
  avatarUrl,
  seed,
  attendanceTags = [],
}: {
  style: Style | null;
  firstName?: string | null;
  avatarUrl?: string | null;
  seed?: string;
  attendanceTags?: string[];
}) {
  const [active, setActive] = useState<number | null>(null);

  const dims: Dim[] = STYLE_SPECTRUMS.map((s) => {
    const v = styleValue(style, s.key);
    return { s, v, lean: styleLean(v), intensity: styleIntensity(v) };
  });
  const title = archetype(dims);

  return (
    <section>
      <h2 className="text-lg">Meu estilo de atendimento</h2>

      {/* Cartão de perfil (ficha) */}
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/5 via-background to-accent/5">
        {/* Cabeçalho: avatar + arquétipo */}
        <div className="flex items-center gap-4 border-b border-border/70 p-5">
          <AvatarBubble src={avatarUrl} name={firstName ?? null} seed={seed} color={GREEN} size={110} className="w-16 shrink-0" />
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1 text-xs font-medium text-brand-dark">
              <Sparkles className="h-3.5 w-3.5" /> Perfil de abordagem
            </p>
            <p className="font-serif text-xl leading-tight text-heading">{title}</p>
            <p className="text-sm text-foreground-muted">
              Como costuma ser a sessão com {firstName || "este profissional"}.
            </p>
          </div>
        </div>

        {/* Atributos com medidor de nível */}
        <div className="divide-y divide-border/60">
          {dims.map((d, i) => {
            const Icon = ICONS[d.s.icon];
            const color = d.lean === "left" ? TEAL : d.lean === "right" ? GREEN : "#64748b";
            const label = d.lean === "left" ? d.s.left : d.lean === "right" ? d.s.right : "Equilíbrio";
            const desc = d.lean === "left" ? d.s.leftDesc : d.lean === "right" ? d.s.rightDesc : `${d.s.left} ↔ ${d.s.right}`;
            const level = d.lean === "center" ? 1 : Math.max(1, Math.round(d.intensity));
            const on = active === i;
            return (
              <div
                key={d.s.key}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${on ? "bg-brand/5" : ""}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}1a`, color }}>
                  <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold" style={{ color }}>{label}</span>
                    <Pips level={level} color={color} />
                  </div>
                  <p className="truncate text-xs text-foreground-muted">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tipo de atendimento */}
        {attendanceTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/70 px-5 py-4">
            <span className="text-xs font-medium text-foreground-muted">Atende:</span>
            {attendanceTags.map((t) => (
              <span key={t} className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-heading">{t}</span>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 px-1 text-xs text-foreground-muted">
        Cada atributo mostra a tendência do profissional entre dois polos. Não existe
        estilo melhor ou pior — ajuda você a sentir o encaixe.
      </p>
    </section>
  );
}

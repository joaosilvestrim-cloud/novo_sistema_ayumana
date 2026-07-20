// "Meu estilo de atendimento": mapa bipolar do estilo do profissional.
// Cada eixo é uma dimensão com dois polos legítimos. Valor 0 = polo esquerdo,
// 100 = polo direito, 50 = equilíbrio. Fonte ÚNICA: cadastro (sliders) e radar.

export type StyleIcon = "ear" | "calendar" | "care" | "heart" | "chat";

export type StyleSpectrum = {
  key: string;
  left: string; // polo esquerdo (valor baixo)
  right: string; // polo direito (valor alto)
  leftDesc: string;
  rightDesc: string;
  icon: StyleIcon;
};

export const STYLE_SPECTRUMS: StyleSpectrum[] = [
  { key: "direcao", left: "Escuta livre", right: "Direcionamento", leftDesc: "Escuta sem diretividade", rightDesc: "Direção e orientação ativa", icon: "ear" },
  { key: "estrutura", left: "Sessão flexível", right: "Sessão estruturada", leftDesc: "Mais abertura e adaptação", rightDesc: "Mais planejamento e estrutura", icon: "calendar" },
  { key: "tom", left: "Acolhedor", right: "Desafiador", leftDesc: "Ambiente de apoio e validação", rightDesc: "Estímulo ao crescimento e à reflexão", icon: "care" },
  { key: "foco", left: "Foco nas emoções", right: "Foco em estratégias", leftDesc: "Exploração e compreensão emocional", rightDesc: "Praticidade e resolução de problemas", icon: "heart" },
  { key: "registro", left: "Linguagem acessível", right: "Linguagem técnica", leftDesc: "Clara, simples e cotidiana", rightDesc: "Mais conceitos e termos especializados", icon: "chat" },
];

export type Style = Record<string, number>;

export function styleValue(style: Style | null | undefined, key: string): number {
  const v = style?.[key];
  return typeof v === "number" && v >= 0 && v <= 100 ? v : 50;
}

// Regras de faixa: 0–30 forte à esquerda, 31–69 flexível, 70–100 forte à direita.
export function styleTag(s: StyleSpectrum, v: number): string | null {
  if (v <= 30) return s.left;
  if (v >= 70) return s.right;
  return null;
}

/** Polo dominante ('left' | 'right' | 'center'). */
export function styleLean(v: number): "left" | "right" | "center" {
  if (v <= 45) return "left";
  if (v >= 55) return "right";
  return "center";
}

/** Intensidade 0–5 (distância do equilíbrio) para o raio no radar. */
export function styleIntensity(v: number): number {
  return (Math.abs(v - 50) / 50) * 5;
}

/** Leitura dinâmica: intensidade + polo (sem citar o oposto). */
export function styleReading(s: StyleSpectrum, v: number): string {
  if (v <= 30) return `Predomínio de ${s.left.toLowerCase()}`;
  if (v >= 70) return `Predomínio de ${s.right.toLowerCase()}`;
  if (v < 45) return `Tende a ${s.left.toLowerCase()}`;
  if (v > 55) return `Tende a ${s.right.toLowerCase()}`;
  return "Equilíbrio entre os dois";
}

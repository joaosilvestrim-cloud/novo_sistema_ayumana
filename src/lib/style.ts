// "Meu estilo de atendimento": mapa bipolar do estilo do profissional.
// NÃO é ranking de competências — cada eixo mostra a tendência entre dois polos
// legítimos (ex.: escuta livre x direcionamento). Mostra encaixe, não "melhor/pior".
//
// Vocabulário ÚNICO: o cadastro (sliders), as tags e a leitura usam EXATAMENTE
// os mesmos termos dos polos. Sem renomear eixo (evita ruído entre input e output).
// Valor 0 = polo esquerdo, 100 = polo direito, 50 = equilíbrio.

export type StyleSpectrum = {
  key: string;
  left: string; // polo esquerdo (valor baixo)
  right: string; // polo direito (valor alto)
};

export const STYLE_SPECTRUMS: StyleSpectrum[] = [
  { key: "direcao", left: "Escuta livre", right: "Direcionamento" },
  { key: "estrutura", left: "Sessão flexível", right: "Sessão estruturada" },
  { key: "tom", left: "Acolhedor", right: "Desafiador" },
  { key: "foco", left: "Foco nas emoções", right: "Foco em estratégias" },
  { key: "registro", left: "Linguagem acessível", right: "Linguagem técnica" },
];

export type Style = Record<string, number>;

export function styleValue(style: Style | null | undefined, key: string): number {
  const v = style?.[key];
  return typeof v === "number" && v >= 0 && v <= 100 ? v : 50;
}

// Regras de negócio (faixas): 0–30 forte à esquerda, 31–69 flexível/equilibrado,
// 70–100 forte à direita. A tag só aparece nos extremos.
/** Etiqueta-resumo = polo dominante nos extremos (termo exato), ou null no meio. */
export function styleTag(s: StyleSpectrum, v: number): string | null {
  if (v <= 30) return s.left;
  if (v >= 70) return s.right;
  return null;
}

/** Leitura dinâmica: intensidade + polo (sem citar o oposto). */
export function styleReading(s: StyleSpectrum, v: number): string {
  if (v <= 30) return `Predomínio de ${s.left.toLowerCase()}`;
  if (v >= 70) return `Predomínio de ${s.right.toLowerCase()}`;
  if (v < 45) return `Tende a ${s.left.toLowerCase()}`;
  if (v > 55) return `Tende a ${s.right.toLowerCase()}`;
  return "Equilíbrio entre os dois";
}

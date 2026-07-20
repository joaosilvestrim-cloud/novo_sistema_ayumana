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

/** Etiqueta-resumo = o polo para o qual pende (termo exato), ou null no meio. */
export function styleTag(s: StyleSpectrum, v: number): string | null {
  if (v <= 40) return s.left;
  if (v >= 60) return s.right;
  return null;
}

/** Leitura dinâmica: intensidade + polo dominante (sem citar o polo oposto). */
export function styleReading(s: StyleSpectrum, v: number): string {
  const dist = Math.abs(v - 50);
  if (dist < 12) return "Equilíbrio entre os dois";
  const pole = v > 50 ? s.right : s.left;
  const intens = dist >= 35 ? "Predomínio de" : "Tende a";
  return `${intens} ${pole.toLowerCase()}`;
}

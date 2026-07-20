// "Meu estilo de atendimento": mapa bipolar do estilo do profissional.
// NÃO é um ranking de competências — cada eixo mostra a tendência entre dois
// polos legítimos (ex.: escuta livre x direcionamento). Ajuda o paciente a
// sentir o encaixe, não a julgar "melhor/pior".
// Cada valor vai de 0 (polo esquerdo) a 100 (polo direito). 50 = equilíbrio.
//
// Fonte ÚNICA de verdade: o editor do cadastro e o radar do perfil leem daqui.

export type StyleSpectrum = {
  key: string;
  left: string; // polo esquerdo
  right: string; // polo direito
  axis: string; // rótulo do eixo no radar (aponta para o polo direito)
  tagLeft: string; // etiqueta-resumo quando pende à esquerda
  tagRight: string; // etiqueta-resumo quando pende à direita
};

export const STYLE_SPECTRUMS: StyleSpectrum[] = [
  { key: "direcao", left: "Escuta livre", right: "Direcionamento", axis: "Direcionamento", tagLeft: "Escuta ativa", tagRight: "Direcionadora" },
  { key: "estrutura", left: "Sessão flexível", right: "Sessão estruturada", axis: "Estrutura", tagLeft: "Flexível", tagRight: "Estruturada" },
  { key: "tom", left: "Acolhedor", right: "Desafiador", axis: "Desafio", tagLeft: "Acolhedora", tagRight: "Desafiadora" },
  { key: "foco", left: "Foco nas emoções", right: "Foco em estratégias", axis: "Praticidade", tagLeft: "Foco emocional", tagRight: "Foco prático" },
  { key: "registro", left: "Linguagem acessível", right: "Linguagem técnica", axis: "Formalidade", tagLeft: "Linguagem acessível", tagRight: "Linguagem técnica" },
];

export type Style = Record<string, number>;

export function styleValue(style: Style | null | undefined, key: string): number {
  const v = style?.[key];
  return typeof v === "number" && v >= 0 && v <= 100 ? v : 50;
}

/** Etiqueta-resumo do eixo conforme a posição, ou null se estiver no meio. */
export function styleTag(s: StyleSpectrum, v: number): string | null {
  if (v <= 38) return s.tagLeft;
  if (v >= 62) return s.tagRight;
  return null;
}

/** Frase de interpretação de um eixo. */
export function styleReading(s: StyleSpectrum, v: number): string {
  if (v <= 38) return `Mais ${s.left.toLowerCase()}`;
  if (v >= 62) return `Mais ${s.right.toLowerCase()}`;
  return `Equilíbrio entre ${s.left.toLowerCase()} e ${s.right.toLowerCase()}`;
}

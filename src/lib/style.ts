// "Meu estilo de atendimento": espectros que ajudam o paciente a sentir a sessão.
// Cada valor vai de 0 (polo esquerdo) a 100 (polo direito). 50 = equilíbrio.

export type StyleSpectrum = { key: string; left: string; right: string };

export const STYLE_SPECTRUMS: StyleSpectrum[] = [
  { key: "direcao", left: "Escuta livre", right: "Direcionamento" },
  { key: "estrutura", left: "Sessão flexível", right: "Sessão estruturada" },
  { key: "tom", left: "Acolhedor", right: "Provocador" },
  { key: "foco", left: "Foco nas emoções", right: "Foco em estratégias" },
  { key: "registro", left: "Informal", right: "Técnico" },
];

export type Style = Record<string, number>;

export function styleValue(style: Style | null | undefined, key: string): number {
  const v = style?.[key];
  return typeof v === "number" && v >= 0 && v <= 100 ? v : 50;
}

// Regras de completude do perfil do psicólogo. Fonte única para o admin ver e
// exportar o que falta em cada perfil, separando obrigatório de recomendado.

export type CompletudeInput = {
  display_name: string | null;
  crp_number: string | null;
  crp_uf: string | null;
  crp_document_path: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  city: string | null;
  phone_whatsapp: string | null;
  session_price_cents: number | null;
  video_url: string | null;
  hasApproaches: boolean;
  hasSpecialties: boolean;
};

type Campo = { key: keyof CompletudeInput; label: string; dica?: string };

// Obrigatórios: sem eles o perfil não fica completo nem é publicado.
export const OBRIGATORIOS: Campo[] = [
  { key: "display_name", label: "Nome de exibição" },
  { key: "crp_number", label: "Número do CRP" },
  { key: "crp_uf", label: "UF do CRP" },
  { key: "crp_document_path", label: "Documento do CRP", dica: "foto da carteirinha ou e-Psi" },
  { key: "headline", label: "Título do perfil" },
  { key: "bio", label: "Apresentação (bio)" },
];

// Recomendados: não travam a publicação, mas aumentam muito a visibilidade.
export const RECOMENDADOS: Campo[] = [
  { key: "avatar_url", label: "Foto de perfil", dica: "perfis com foto recebem muito mais cliques" },
  { key: "hasSpecialties", label: "Temas que atende", dica: "é o filtro nº 1 dos pacientes" },
  { key: "hasApproaches", label: "Abordagem" },
  { key: "city", label: "Cidade" },
  { key: "phone_whatsapp", label: "WhatsApp" },
  { key: "session_price_cents", label: "Valor da sessão" },
  { key: "video_url", label: "Vídeo de apresentação", dica: "recurso do plano Voz" },
];

function textoLimpo(v: string | null): boolean {
  if (!v) return false;
  return v.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;
}

function preenchido(key: keyof CompletudeInput, i: CompletudeInput): boolean {
  const v = i[key];
  if (key === "bio" || key === "headline") return textoLimpo(v as string | null);
  if (key === "session_price_cents") return !!v && (v as number) > 0;
  if (key === "hasApproaches" || key === "hasSpecialties") return !!v;
  return !!v;
}

export function avaliarCompletude(i: CompletudeInput) {
  const faltaObrigatorio = OBRIGATORIOS.filter((c) => !preenchido(c.key, i));
  const faltaRecomendado = RECOMENDADOS.filter((c) => !preenchido(c.key, i));
  const total = OBRIGATORIOS.length + RECOMENDADOS.length;
  const preenchidos = total - faltaObrigatorio.length - faltaRecomendado.length;
  const percent = Math.round((preenchidos / total) * 100);
  return {
    faltaObrigatorio,
    faltaRecomendado,
    percent,
    completo: faltaObrigatorio.length === 0,
  };
}

// Vantagens de completar, para mostrar ao psicólogo e no admin.
export const VANTAGENS_PERFIL_COMPLETO = [
  "Aparece muito mais na busca (perfil incompleto fica quase invisível).",
  "Foto e temas são o que mais gera cliques e contatos.",
  "Perfil completo com CRP verificado passa mais confiança ao paciente.",
  "Habilita o link do seu perfil para divulgar nas redes e no WhatsApp.",
  "Com o Voz, ainda ganha vídeo, prioridade máxima e o fórum (que indexa no Google).",
];

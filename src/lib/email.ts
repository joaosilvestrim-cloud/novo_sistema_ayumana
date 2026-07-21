import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailShell } from "@/lib/email-template";

export { emailShell };
export type { EmailBlock, EmailShellOptions } from "@/lib/email-template";

const FROM = process.env.EMAIL_FROM || "Ayumana <contato@ayumana.com.br>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/** Tipos de notificação, usados para filtrar no admin. */
export type NotificationKind =
  | "crp_aprovado"
  | "crp_reprovado"
  | "trial_7"
  | "trial_1"
  | "senha"
  | "suporte"
  | "broadcast"
  | "outro";

/** Texto puro a partir do HTML, para o resumo na listagem do admin. */
function toPreview(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

/** Grava o envio no log. Nunca derruba o fluxo se falhar. */
async function logNotification(row: {
  kind: NotificationKind;
  to: string | string[];
  bcc?: string[];
  subject: string;
  html: string;
  ok: boolean;
  error?: string | null;
  profileId?: string | null;
  createdBy?: string | null;
}) {
  try {
    const admin = createAdminClient();
    const destinos = row.bcc?.length ? row.bcc : Array.isArray(row.to) ? row.to : [row.to];
    await admin.from("notifications").insert(
      destinos.map((to_email) => ({
        kind: row.kind,
        to_email,
        subject: row.subject,
        preview: toPreview(row.html),
        status: row.ok ? "enviado" : "falhou",
        error: row.error ?? null,
        profile_id: row.profileId ?? null,
        created_by: row.createdBy ?? null,
      }))
    );
  } catch {
    // log é acessório: nunca impede o envio
  }
}

/** Envia um e-mail e registra no log. Retorna false se o Resend não estiver configurado. */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  /** Cópia oculta: usada nos comunicados em massa, um bloco por chamada. */
  bcc?: string[];
  kind?: NotificationKind;
  profileId?: string | null;
  createdBy?: string | null;
  log?: boolean;
}): Promise<boolean> {
  const kind = params.kind ?? "outro";
  const registrar = params.log !== false;
  const resend = client();

  if (!resend) {
    if (registrar) {
      await logNotification({ ...params, kind, ok: false, error: "Resend não configurado" });
    }
    return false;
  }

  let ok = false;
  let erro: string | null = null;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      ...(params.bcc?.length ? { bcc: params.bcc } : {}),
      subject: params.subject,
      html: params.html,
    });
    ok = !error;
    erro = error?.message ?? null;
  } catch (e) {
    erro = e instanceof Error ? e.message : "Falha desconhecida no envio";
  }

  if (registrar) await logNotification({ ...params, kind, ok, error: erro });
  return ok;
}

export async function sendCrpApproved(to: string, name: string | null, slug: string | null) {
  const nome = name?.split(" ")[0] || "";
  const url = slug ? `${SITE}/psicologo/${slug}` : `${SITE}/painel`;
  return sendEmail({
    to,
    subject: "Seu perfil na Ayumana foi aprovado",
    kind: "crp_aprovado",
    html: emailShell({
      preheader: "Seu CRP foi verificado e seu perfil já está no ar.",
      heading: `Tudo certo${nome ? `, ${nome}` : ""}!`,
      intro:
        "Conferimos o seu CRP e está tudo em ordem. Seu perfil já está publicado na Ayumana.",
      blocks: [
        { type: "paragraph", text: "O que muda a partir de agora:" },
        {
          type: "list",
          tone: "positivo",
          items: [
            "Você aparece na busca de quem procura terapia em português",
            "Quem se interessar fala com você direto pelo WhatsApp",
            "Seu perfil tem endereço próprio, que você pode divulgar onde quiser",
          ],
        },
        {
          type: "note",
          tone: "bom",
          title: "Uma dica que faz diferença",
          text: "Perfis com foto, valor da sessão e horários preenchidos recebem bem mais contatos. Se algum desses campos ainda estiver vazio, vale completar hoje.",
        },
      ],
      cta: { label: "Ver meu perfil", url },
      secondary: { label: "Completar meu cadastro", url: `${SITE}/painel/onboarding` },
      footerNote: "Você recebeu este e-mail porque tem cadastro de profissional na Ayumana.",
    }),
  });
}

export async function sendCrpRejected(to: string, name: string | null, reason: string) {
  const nome = name?.split(" ")[0] || "";
  return sendEmail({
    to,
    subject: "Sobre a verificação do seu perfil na Ayumana",
    kind: "crp_reprovado",
    html: emailShell({
      preheader: "Falta um ajuste para liberarmos seu perfil.",
      heading: `Precisamos de um ajuste${nome ? `, ${nome}` : ""}`,
      intro:
        "Não conseguimos concluir a verificação do seu CRP. Nada de grave, é só corrigir e enviar de novo.",
      blocks: [
        { type: "note", tone: "atencao", title: "O que precisa ser corrigido", text: reason },
        { type: "paragraph", text: "Para resolver:" },
        {
          type: "steps",
          items: [
            "Abra seu painel e vá em Meu perfil",
            "Corrija o que apontamos acima e confira se o documento está legível",
            "Clique em enviar para verificação de novo",
          ],
        },
        {
          type: "paragraph",
          text: "Assim que você reenviar, a gente revisa e te avisa por aqui.",
        },
      ],
      cta: { label: "Corrigir meu cadastro", url: `${SITE}/painel/onboarding` },
      footerNote: "Você recebeu este e-mail porque tem cadastro de profissional na Ayumana.",
    }),
  });
}

/** Aviso de que o teste gratuito está acabando (7 dias antes e 1 dia antes). */
export async function sendTrialEnding(
  to: string,
  name: string | null,
  dias: number,
  planoNome: string
) {
  const nome = name?.split(" ")[0] || "";
  const quando = dias <= 1 ? "termina amanhã" : `termina em ${dias} dias`;
  return sendEmail({
    to,
    subject:
      dias <= 1
        ? `Seu teste do plano ${planoNome} termina amanhã`
        : `Faltam ${dias} dias do seu teste do plano ${planoNome}`,
    kind: dias <= 1 ? "trial_1" : "trial_7",
    html: emailShell({
      preheader: `Depois disso seu perfil volta ao plano gratuito.`,
      heading: `Seu teste ${quando}${nome ? `, ${nome}` : ""}`,
      intro: `Você está usando o plano ${planoNome} de graça na Ayumana, e ele ${quando}.`,
      blocks: [
        { type: "paragraph", text: "Enquanto o teste vale, seu perfil tem:" },
        {
          type: "list",
          tone: "positivo",
          items: [
            "Prioridade na busca, aparecendo antes dos perfis gratuitos",
            "O valor da sua sessão visível para quem procura",
            "Vídeo de apresentação no perfil",
            "Espaço para responder perguntas no fórum e ser encontrado por elas",
          ],
        },
        {
          type: "note",
          tone: dias <= 1 ? "atencao" : "info",
          title: `O que acontece quando o teste ${quando}`,
          text: "Seu perfil continua no ar, mas volta para o plano gratuito e perde os itens acima. Nada é apagado, e você pode assinar depois se preferir.",
        },
        {
          type: "paragraph",
          text: "Para continuar com tudo isso, é só assinar. Sem fidelidade e sem multa, você cancela quando quiser.",
        },
      ],
      cta: { label: "Manter meu plano", url: `${SITE}/painel/assinatura` },
      secondary: { label: "Ver o que cada plano inclui", url: `${SITE}/para-psicologos` },
      footerNote: "Você recebeu este e-mail porque está com um teste gratuito ativo na Ayumana.",
    }),
  });
}

/** Para onde vão os pedidos de suporte. Pode ser sobrescrito por env. */
export const SUPPORT_EMAILS = (
  process.env.SUPPORT_EMAILS || "joao.silvestrim@a2f.com.br,luiz.alcoba@a2f.com.br"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || "5511981559500";

/** Avisa o time quando um psicólogo pede ajuda pelo painel. */
export async function sendSupportRequest(params: {
  name: string | null;
  email: string | null;
  phone?: string | null;
  plan?: string | null;
  message?: string | null;
  profileId?: string | null;
}) {
  const rows: Array<[string, string]> = [
    ["Nome", params.name || "—"],
    ["E-mail", params.email || "—"],
  ];
  if (params.phone) rows.push(["WhatsApp", params.phone]);
  if (params.plan) rows.push(["Plano", params.plan]);

  const msg = params.message?.trim();

  return sendEmail({
    to: SUPPORT_EMAILS,
    subject: `Pedido de ajuda na Ayumana — ${params.name || params.email || "psicólogo"}`,
    kind: "suporte",
    profileId: params.profileId ?? null,
    html: emailShell({
      preheader: `${params.name || params.email || "Um psicólogo"} pediu ajuda pelo painel.`,
      heading: "Alguém pediu ajuda",
      intro: "Um psicólogo clicou no botão de ajuda dentro do painel.",
      blocks: [
        { type: "data", rows },
        ...(msg
          ? ([{ type: "note", tone: "info", title: "O que a pessoa escreveu", text: msg }] as const)
          : []),
        {
          type: "paragraph",
          text: "Ela já foi levada para o WhatsApp do suporte, então provavelmente a conversa começa por lá.",
        },
      ],
      cta: params.profileId
        ? { label: "Abrir no admin", url: `${SITE}/admin/usuarios/${params.profileId}` }
        : undefined,
      footerNote: "Aviso interno da equipe Ayumana.",
    }),
  });
}

export async function sendClaimProfile(to: string, name: string | null, link: string) {
  const nome = name?.split(" ")[0] || "";
  return sendEmail({
    to,
    subject: "Seu perfil na Ayumana está pronto",
    html: emailShell({
      preheader: "Defina sua senha e assuma o acesso ao seu perfil.",
      heading: `Olá${nome ? `, ${nome}` : ""}!`,
      intro:
        "A Ayumana é a nova plataforma de psicólogos brasileiros, no Brasil e no exterior. Já deixamos seu perfil preparado, esperando você.",
      blocks: [
        { type: "paragraph", text: "São três passos rápidos:" },
        {
          type: "steps",
          items: [
            "Clique no botão abaixo e escolha sua senha",
            "Confira seus dados e adicione uma foto",
            "Publique seu perfil e comece a receber contatos",
          ],
        },
        {
          type: "note",
          tone: "atencao",
          title: "Atenção ao prazo",
          text: "Este link é pessoal e expira em pouco tempo. Se ele vencer, é só pedir um novo na tela de login.",
        },
      ],
      cta: { label: "Assumir meu perfil", url: link },
      footerNote: "Você recebeu este e-mail porque seu perfil profissional foi preparado na Ayumana.",
    }),
  });
}

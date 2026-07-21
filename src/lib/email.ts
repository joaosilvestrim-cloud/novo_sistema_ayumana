import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

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

/** Template base com a marca Ayumana (estilos inline p/ clientes de e-mail). */
export function emailShell(opts: {
  heading: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
}): string {
  const petroleo = "#05474A";
  const verde = "#73A533";
  return `
  <div style="margin:0;padding:0;background:#f7faf9;font-family:Arial,Helvetica,sans-serif;color:#1e2b2a;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:${petroleo};border-radius:16px 16px 0 0;padding:24px 28px;">
        <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
          <span style="display:inline-block;width:12px;height:12px;background:${verde};border-radius:999px;margin-right:8px;"></span>ayumana
        </span>
      </div>
      <div style="background:#ffffff;border:1px solid #dde5e3;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
        <h1 style="margin:0 0 14px;font-size:22px;color:${petroleo};">${opts.heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3a4645;">${opts.bodyHtml}</div>
        ${
          opts.cta
            ? `<div style="margin:26px 0 6px;">
                 <a href="${opts.cta.url}" style="display:inline-block;background:${verde};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:10px;">${opts.cta.label}</a>
               </div>`
            : ""
        }
      </div>
      <p style="text-align:center;color:#96a5a2;font-size:12px;margin:16px 0;">
        Ayumana — terapia em português, onde você estiver.<br/>
        Em crise? Ligue para o CVV 188.
      </p>
    </div>
  </div>`;
}

export async function sendCrpApproved(to: string, name: string | null, slug: string | null) {
  const nome = name?.split(" ")[0] || "";
  const url = slug ? `${SITE}/psicologo/${slug}` : `${SITE}/painel`;
  return sendEmail({
    to,
    subject: "Seu perfil na Ayumana foi aprovado ✅",
    kind: "crp_aprovado",
    html: emailShell({
      heading: `Tudo certo${nome ? `, ${nome}` : ""}!`,
      bodyHtml: `Seu CRP foi verificado e seu perfil já está <strong>publicado</strong> na Ayumana. A partir de agora você aparece na busca e pode receber contatos direto pelo WhatsApp.`,
      cta: { label: "Ver meu perfil", url },
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
      heading: `Precisamos de um ajuste${nome ? `, ${nome}` : ""}`,
      bodyHtml: `Não conseguimos concluir a verificação do seu CRP. Motivo:<br/><br/><em style="color:#1e2b2a;">${reason}</em><br/><br/>Corrija os dados no seu painel e envie novamente para revisão.`,
      cta: { label: "Abrir meu painel", url: `${SITE}/painel/onboarding` },
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
      heading: `Seu teste ${quando}${nome ? `, ${nome}` : ""}`,
      bodyHtml: `Você está usando o plano <strong>${planoNome}</strong> de graça na Ayumana, e ele ${quando}.<br/><br/>
        Quando o teste acabar, seu perfil volta ao plano gratuito e você perde:
        <br/>• prioridade na busca
        <br/>• exibição do valor da sessão
        <br/>• vídeo de apresentação no perfil
        <br/>• participação no fórum
        <br/><br/>Para continuar com tudo isso, é só assinar. Sem fidelidade, cancela quando quiser.`,
      cta: { label: "Manter meu plano", url: `${SITE}/painel/assinatura` },
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
  const linhas = [
    `<strong>Quem pediu:</strong> ${params.name || "—"}`,
    `<strong>E-mail:</strong> ${params.email || "—"}`,
    params.phone ? `<strong>WhatsApp:</strong> ${params.phone}` : null,
    params.plan ? `<strong>Plano:</strong> ${params.plan}` : null,
  ]
    .filter(Boolean)
    .join("<br/>");

  const msg = params.message?.trim();

  return sendEmail({
    to: SUPPORT_EMAILS,
    subject: `Pedido de ajuda na Ayumana — ${params.name || params.email || "psicólogo"}`,
    kind: "suporte",
    profileId: params.profileId ?? null,
    html: emailShell({
      heading: "Alguém clicou em suporte",
      bodyHtml: `${linhas}${
        msg ? `<br/><br/><strong>Mensagem:</strong><br/><em>${msg}</em>` : ""
      }<br/><br/>A pessoa foi direcionada ao WhatsApp do suporte.`,
      cta: params.profileId
        ? { label: "Abrir no admin", url: `${SITE}/admin/usuarios/${params.profileId}` }
        : undefined,
    }),
  });
}

export async function sendClaimProfile(to: string, name: string | null, link: string) {
  const nome = name?.split(" ")[0] || "";
  return sendEmail({
    to,
    subject: "Seu perfil na Ayumana está pronto — assuma o acesso",
    html: emailShell({
      heading: `Olá${nome ? `, ${nome}` : ""}!`,
      bodyHtml: `A Ayumana é a nova plataforma de psicólogos brasileiros, no Brasil e no exterior. Já preparamos seu perfil. Clique abaixo para definir sua senha e assumir o acesso. O link é pessoal e expira em breve.`,
      cta: { label: "Assumir meu perfil", url: link },
    }),
  });
}

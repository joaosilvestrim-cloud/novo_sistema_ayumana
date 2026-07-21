import "server-only";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Ayumana <contato@ayumana.com.br>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/** Envia um e-mail. Retorna false silenciosamente se o Resend não estiver configurado. */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = client();
  if (!resend) return false;
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return !error;
  } catch {
    return false;
  }
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

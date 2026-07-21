import "server-only";

/**
 * Template dos e-mails da Ayumana.
 *
 * Regras que valem para todo e-mail do sistema:
 *  - abre com a marca de verdade (logo em imagem, não texto)
 *  - explica o contexto antes de pedir qualquer coisa
 *  - tem no máximo um botão principal
 *  - fecha com ajuda e o CVV
 *
 * HTML de e-mail é conservador de propósito: tabelas, estilos embutidos e
 * nada de flexbox ou grid, porque o Outlook ignora.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";
const WHATSAPP = process.env.SUPPORT_WHATSAPP || "5511981559500";

const C = {
  petroleo: "#05474A",
  verde: "#73A533",
  azul: "#53C4CC",
  amarelo: "#F5C84B",
  fundo: "#F1F5F3",
  papel: "#FFFFFF",
  texto: "#2B3A38",
  suave: "#6B7A77",
  borda: "#E3EAE7",
};

const FONTE =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Blocos de conteúdo. Cada e-mail monta o seu com o que fizer sentido. */
export type EmailBlock =
  | { type: "paragraph"; text: string }
  /** Passo a passo numerado. Use quando a pessoa precisa fazer algo. */
  | { type: "steps"; items: string[] }
  /** Lista de itens com marcador. Use para enumerar benefícios ou perdas. */
  | { type: "list"; items: string[]; tone?: "positivo" | "neutro" | "atencao" }
  /** Caixa destacada para o recado que não pode passar batido. */
  | { type: "note"; title?: string; text: string; tone?: "info" | "atencao" | "bom" }
  /** Pares de rótulo e valor, tipo ficha de dados. */
  | { type: "data"; rows: Array<[string, string]> }
  /** Linha divisória discreta. */
  | { type: "divider" };

export type EmailShellOptions = {
  /** Frase de prévia, aquela que aparece na caixa de entrada ao lado do assunto. */
  preheader?: string;
  heading: string;
  /** Frase de abertura, em corpo maior, logo abaixo do título. */
  intro?: string;
  blocks?: EmailBlock[];
  /** HTML solto, para casos que não valem virar bloco. */
  bodyHtml?: string;
  cta?: { label: string; url: string };
  /** Link secundário abaixo do botão, sem destaque. */
  secondary?: { label: string; url: string };
  /** Explica por que a pessoa recebeu este e-mail. */
  footerNote?: string;
};

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;");
}

function renderBlock(b: EmailBlock): string {
  switch (b.type) {
    case "paragraph":
      return `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:${C.texto};">${b.text}</p>`;

    case "steps":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;">
        ${b.items
          .map(
            (item, i) => `<tr>
              <td width="34" valign="top" style="padding:0 0 12px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center" width="26" height="26" style="width:26px;height:26px;background:${C.verde};border-radius:13px;color:#ffffff;font-family:${FONTE};font-size:13px;font-weight:700;line-height:26px;">${i + 1}</td></tr>
                </table>
              </td>
              <td valign="top" style="padding:2px 0 12px;font-size:16px;line-height:1.6;color:${C.texto};">${item}</td>
            </tr>`
          )
          .join("")}
      </table>`;

    case "list": {
      const cor =
        b.tone === "positivo" ? C.verde : b.tone === "atencao" ? "#C2410C" : C.azul;
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;">
        ${b.items
          .map(
            (item) => `<tr>
              <td width="20" valign="top" style="padding:0 0 8px;">
                <div style="width:7px;height:7px;margin-top:8px;background:${cor};border-radius:4px;"></div>
              </td>
              <td valign="top" style="padding:0 0 8px;font-size:16px;line-height:1.6;color:${C.texto};">${item}</td>
            </tr>`
          )
          .join("")}
      </table>`;
    }

    case "note": {
      const paleta =
        b.tone === "atencao"
          ? { bg: "#FEF6E7", borda: C.amarelo, titulo: "#8A5A00" }
          : b.tone === "bom"
            ? { bg: "#F1F7EC", borda: C.verde, titulo: "#3F6318" }
            : { bg: "#ECF7F8", borda: C.azul, titulo: C.petroleo };
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;">
        <tr>
          <td style="padding:14px 16px;background:${paleta.bg};border-left:3px solid ${paleta.borda};border-radius:6px;">
            ${b.title ? `<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${paleta.titulo};">${b.title}</p>` : ""}
            <p style="margin:0;font-size:15px;line-height:1.6;color:${C.texto};">${b.text}</p>
          </td>
        </tr>
      </table>`;
    }

    case "data":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 16px;border:1px solid ${C.borda};border-radius:8px;">
        ${b.rows
          .map(
            ([k, v], i) => `<tr>
              <td style="padding:10px 14px;font-size:14px;color:${C.suave};${i ? `border-top:1px solid ${C.borda};` : ""}width:38%;">${k}</td>
              <td style="padding:10px 14px;font-size:14px;color:${C.texto};font-weight:600;${i ? `border-top:1px solid ${C.borda};` : ""}">${v}</td>
            </tr>`
          )
          .join("")}
      </table>`;

    case "divider":
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 20px;">
        <tr><td style="border-top:1px solid ${C.borda};font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>`;
  }
}

export function emailShell(opts: EmailShellOptions): string {
  const conteudo = [
    opts.intro
      ? `<p style="margin:0 0 18px;font-size:17px;line-height:1.6;color:${C.texto};">${opts.intro}</p>`
      : "",
    (opts.blocks ?? []).map(renderBlock).join(""),
    opts.bodyHtml
      ? `<div style="font-size:16px;line-height:1.65;color:${C.texto};">${opts.bodyHtml}</div>`
      : "",
  ].join("");

  const botao = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
        <tr>
          <td align="center" style="background:${C.verde};border-radius:10px;">
            <a href="${escapeAttr(opts.cta.url)}" style="display:inline-block;padding:14px 30px;font-family:${FONTE};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${opts.cta.label}</a>
          </td>
        </tr>
      </table>`
    : "";

  const secundario = opts.secondary
    ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.6;">
        <a href="${escapeAttr(opts.secondary.url)}" style="color:${C.petroleo};text-decoration:underline;">${opts.secondary.label}</a>
      </p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>Ayumana</title>
</head>
<body style="margin:0;padding:0;background:${C.fundo};">
${
  opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${opts.preheader}</div>`
    : ""
}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.fundo};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px;">

        <!-- Marca -->
        <tr>
          <td align="center" style="padding:0 0 22px;">
            <a href="${SITE}" style="text-decoration:none;">
              <img src="${SITE}/brand/ayumana-logo.png" width="150" alt="Ayumana" style="display:block;width:150px;max-width:150px;height:auto;border:0;"/>
            </a>
          </td>
        </tr>

        <!-- Cartão -->
        <tr>
          <td style="background:${C.papel};border:1px solid ${C.borda};border-radius:18px;overflow:hidden;">
            <!-- fita da marca -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="25%" height="5" style="height:5px;background:${C.petroleo};font-size:0;line-height:0;">&nbsp;</td>
                <td width="25%" height="5" style="height:5px;background:${C.verde};font-size:0;line-height:0;">&nbsp;</td>
                <td width="25%" height="5" style="height:5px;background:${C.azul};font-size:0;line-height:0;">&nbsp;</td>
                <td width="25%" height="5" style="height:5px;background:${C.amarelo};font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:34px 34px 36px;font-family:${FONTE};">
                  <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;font-weight:400;color:${C.petroleo};">${opts.heading}</h1>
                  ${conteudo}
                  ${botao}
                  ${secundario}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Ajuda -->
        <tr>
          <td style="padding:18px 6px 0;font-family:${FONTE};">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="padding:14px 18px;background:#E8F0EC;border-radius:12px;font-size:14px;line-height:1.6;color:${C.petroleo};">
                  Ficou com dúvida? Fale com a gente no
                  <a href="https://wa.me/${WHATSAPP}" style="color:${C.petroleo};font-weight:700;text-decoration:underline;">WhatsApp</a>
                  ou responda este e-mail. A gente responde de verdade.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Rodapé -->
        <tr>
          <td align="center" style="padding:22px 12px 8px;font-family:${FONTE};font-size:12px;line-height:1.7;color:${C.suave};">
            ${opts.footerNote ? `${opts.footerNote}<br/><br/>` : ""}
            <strong style="color:${C.petroleo};">Ayumana</strong> — terapia em português, onde você estiver.<br/>
            <a href="${SITE}" style="color:${C.suave};text-decoration:underline;">ayumana.com.br</a>
            &nbsp;·&nbsp;
            <a href="${SITE}/painel" style="color:${C.suave};text-decoration:underline;">Meu painel</a><br/><br/>
            Em crise? Ligue para o CVV no <strong>188</strong>. É gratuito e funciona 24 horas.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

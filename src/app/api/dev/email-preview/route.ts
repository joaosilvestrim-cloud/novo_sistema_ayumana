import { NextResponse, type NextRequest } from "next/server";
import { emailShell } from "@/lib/email-template";

/**
 * Pré-visualização dos e-mails, só em desenvolvimento.
 * Use /api/dev/email-preview?tipo=trial para abrir cada um no navegador.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "indisponível" }, { status: 404 });
  }

  const tipo = request.nextUrl.searchParams.get("tipo") ?? "trial";
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ayumana.com.br";

  const exemplos: Record<string, string> = {
    trial: emailShell({
      preheader: "Depois disso seu perfil volta ao plano gratuito.",
      heading: "Seu teste termina em 7 dias, Marina",
      intro: "Você está usando o plano Voz de graça na Ayumana, e ele termina em 7 dias.",
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
          tone: "info",
          title: "O que acontece quando o teste termina em 7 dias",
          text: "Seu perfil continua no ar, mas volta para o plano gratuito e perde os itens acima. Nada é apagado, e você pode assinar depois se preferir.",
        },
        {
          type: "paragraph",
          text: "Para continuar com tudo isso, é só assinar. Sem fidelidade e sem multa, você cancela quando quiser.",
        },
      ],
      cta: { label: "Manter meu plano", url: `${site}/painel/assinatura` },
      secondary: { label: "Ver o que cada plano inclui", url: `${site}/para-psicologos` },
      footerNote: "Você recebeu este e-mail porque está com um teste gratuito ativo na Ayumana.",
    }),

    aprovado: emailShell({
      preheader: "Seu CRP foi verificado e seu perfil já está no ar.",
      heading: "Tudo certo, Marina!",
      intro: "Conferimos o seu CRP e está tudo em ordem. Seu perfil já está publicado na Ayumana.",
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
          text: "Perfis com foto, valor da sessão e horários preenchidos recebem bem mais contatos.",
        },
      ],
      cta: { label: "Ver meu perfil", url: `${site}/painel` },
      secondary: { label: "Completar meu cadastro", url: `${site}/painel/onboarding` },
      footerNote: "Você recebeu este e-mail porque tem cadastro de profissional na Ayumana.",
    }),

    reprovado: emailShell({
      heading: "Precisamos de um ajuste, Marina",
      intro: "Não conseguimos concluir a verificação do seu CRP. Nada de grave, é só corrigir e enviar de novo.",
      blocks: [
        {
          type: "note",
          tone: "atencao",
          title: "O que precisa ser corrigido",
          text: "A foto do documento está desfocada e não dá para ler o número do registro.",
        },
        { type: "paragraph", text: "Para resolver:" },
        {
          type: "steps",
          items: [
            "Abra seu painel e vá em Meu perfil",
            "Corrija o que apontamos acima e confira se o documento está legível",
            "Clique em enviar para verificação de novo",
          ],
        },
      ],
      cta: { label: "Corrigir meu cadastro", url: `${site}/painel/onboarding` },
    }),

    suporte: emailShell({
      heading: "Alguém pediu ajuda",
      intro: "Um psicólogo clicou no botão de ajuda dentro do painel.",
      blocks: [
        {
          type: "data",
          rows: [
            ["Nome", "Marina Duarte"],
            ["E-mail", "marina@exemplo.com"],
            ["WhatsApp", "+55 11 99999-0000"],
            ["Plano", "Voz"],
          ],
        },
        {
          type: "note",
          tone: "info",
          title: "O que a pessoa escreveu",
          text: "Não consigo enviar meu documento do CRP, a tela trava no envio.",
        },
      ],
      cta: { label: "Abrir no admin", url: `${site}/admin/usuarios/1` },
      footerNote: "Aviso interno da equipe Ayumana.",
    }),
  };

  const html = exemplos[tipo] ?? exemplos.trial;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

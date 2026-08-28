import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSupportRequest } from "@/lib/email";
import { buildSystemPrompt, type UserContexto } from "@/lib/assistant/knowledge";
import { avaliarCompletude } from "@/lib/profile-completeness";
import { PLAN_LABEL } from "@/lib/plan-labels";
import type { PlanTier } from "@/lib/types";

export const maxDuration = 30;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Modelos confirmados nesta conta do Groq. O 120b é o mais capaz; o 20b é a
// reserva, mais rápido. Dá para trocar pela env GROQ_MODEL se quiser.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MODEL_FALLBACK = "openai/gpt-oss-20b";

type ChatMsg = { role: "user" | "assistant" | "system" | "tool"; content: string; tool_call_id?: string; name?: string };

// Ferramenta que o modelo pode chamar para pedir ajuda humana (envia e-mail à equipe).
const TOOLS = [
  {
    type: "function",
    function: {
      name: "escalar_para_equipe",
      description:
        "Encaminha o pedido da pessoa para a equipe humana da Ayumana por e-mail. Só chame esta ferramenta DEPOIS de já saber, de forma concreta, o que a pessoa precisa. Se ela só disse 'quero falar com a equipe' sem explicar, pergunte antes o que ela deseja resolver, e só então chame a ferramenta com um resumo claro.",
      parameters: {
        type: "object",
        properties: {
          resumo: {
            type: "string",
            description: "Resumo curto do que a pessoa precisa, em português, para a equipe entender rápido.",
          },
        },
        required: ["resumo"],
      },
    },
  },
];

async function callGroq(apiKey: string, messages: ChatMsg[], withTools: boolean, model: string) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.15,
      max_tokens: 700,
      ...(withTools ? { tools: TOOLS, tool_choice: "auto" } : {}),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

/** Tenta o modelo configurado; se ele não existir (404), cai para o universal. */
async function chat(apiKey: string, messages: ChatMsg[], withTools: boolean) {
  try {
    return await callGroq(apiKey, messages, withTools, MODEL);
  } catch (e) {
    const msg = (e as Error).message;
    if (MODEL !== MODEL_FALLBACK && /404|does not exist|do not have access|decommission/i.test(msg)) {
      return await callGroq(apiKey, messages, withTools, MODEL_FALLBACK);
    }
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { reply: "A assistente está fora do ar no momento. Se precisar, fale com a equipe pelo WhatsApp no rodapé do site." },
      { status: 200 }
    );
  }

  const body = await req.json().catch(() => null);
  const incoming = Array.isArray(body?.messages) ? (body.messages as ChatMsg[]) : [];
  // Só as últimas trocas, e limita o tamanho de cada mensagem (defesa contra abuso).
  const historico = incoming
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => ({ role: m.role, content: String(m.content ?? "").slice(0, 2000) }));
  if (!historico.length || historico[historico.length - 1].role !== "user") {
    return NextResponse.json({ reply: "Pode me mandar sua dúvida?" }, { status: 200 });
  }

  // Auth + contexto ao vivo.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const logado = !!user;

  const admin = createAdminClient();
  const { data: planosRaw } = await admin
    .from("plans")
    .select("id, name, price_label")
    .order("sort_order");
  const planos = (planosRaw ?? []) as { id: string; name: string; price_label: string | null }[];

  let usuario: UserContexto | null = null;
  let contatoEmail: string | null = null;
  let contatoNome: string | null = null;
  let psyId: string | null = null;
  let contatoTelefone: string | null = null;
  let planoLabel = "";
  if (user) {
    const { data: prof } = await admin.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
    const { data: psy } = await admin
      .from("psychologists")
      .select("id, plan_tier, trial_tier, trial_ends_at, verification_status, profile_completed, is_published, phone_whatsapp, crp_number, crp_uf, crp_document_path, headline, bio, avatar_url, city, session_price_cents, video_url")
      .eq("profile_id", user.id)
      .maybeSingle();
    contatoEmail = (prof?.email as string) ?? user.email ?? null;
    contatoNome = (prof?.full_name as string) ?? null;
    if (psy) {
      psyId = psy.id as string;
      contatoTelefone = (psy.phone_whatsapp as string) ?? null;
      const emTeste = !!psy.trial_ends_at && new Date(psy.trial_ends_at as string) > new Date();
      const efetivo = (emTeste ? (psy.trial_tier as PlanTier) : (psy.plan_tier as PlanTier)) ?? "essencial";
      planoLabel = PLAN_LABEL[efetivo] ?? "Raiz";

      // O que falta no perfil desta pessoa, para a Aya responder exatamente.
      const [{ count: nApr }, { count: nEsp }] = await Promise.all([
        admin.from("psychologist_approaches").select("*", { count: "exact", head: true }).eq("psychologist_id", psy.id),
        admin.from("psychologist_specialties").select("*", { count: "exact", head: true }).eq("psychologist_id", psy.id),
      ]);
      const completude = avaliarCompletude({
        display_name: contatoNome,
        crp_number: (psy.crp_number as string) ?? null,
        crp_uf: (psy.crp_uf as string) ?? null,
        crp_document_path: (psy.crp_document_path as string) ?? null,
        headline: (psy.headline as string) ?? null,
        bio: (psy.bio as string) ?? null,
        avatar_url: (psy.avatar_url as string) ?? null,
        city: (psy.city as string) ?? null,
        phone_whatsapp: (psy.phone_whatsapp as string) ?? null,
        session_price_cents: (psy.session_price_cents as number) ?? null,
        video_url: (psy.video_url as string) ?? null,
        hasApproaches: (nApr ?? 0) > 0,
        hasSpecialties: (nEsp ?? 0) > 0,
      });

      usuario = {
        nome: contatoNome,
        plano: planoLabel,
        emTeste,
        trialFim: psy.trial_ends_at ? new Date(psy.trial_ends_at as string).toLocaleDateString("pt-BR") : null,
        verificacao: (psy.verification_status as string) ?? null,
        perfilCompleto: !!psy.profile_completed,
        publicado: !!psy.is_published,
        faltaObrigatorio: completude.faltaObrigatorio.map((c) => c.label),
        faltaRecomendado: completude.faltaRecomendado.map((c) => c.label),
      };
    }
  }

  const system = buildSystemPrompt({ logado, planos, usuario });
  const messages: ChatMsg[] = [{ role: "system", content: system }, ...historico];

  const pergunta = historico[historico.length - 1]?.content ?? "";
  const logInteracao = async (reply: string, escalated: boolean) => {
    try {
      await admin.from("assistant_log").insert({
        question: pergunta.slice(0, 1000),
        reply: reply.slice(0, 2000),
        escalated,
        logged_in: logado,
        psychologist_id: psyId,
      });
    } catch { /* log é acessório */ }
  };

  try {
    const first = await chat(apiKey, messages, logado);
    const choice = first.choices?.[0]?.message;
    const toolCalls = choice?.tool_calls as { id: string; function: { name: string; arguments: string } }[] | undefined;

    let escalated = false;
    if (toolCalls?.length) {
      // Executa a(s) ferramenta(s). Hoje só temos "escalar_para_equipe".
      const toolMsgs: ChatMsg[] = [];
      for (const tc of toolCalls) {
        if (tc.function.name === "escalar_para_equipe") {
          let resumo = "";
          try { resumo = JSON.parse(tc.function.arguments || "{}").resumo ?? ""; } catch { /* */ }
          const ultima = historico[historico.length - 1]?.content ?? "";
          await sendSupportRequest({
            name: contatoNome,
            email: contatoEmail,
            phone: contatoTelefone,
            plan: planoLabel || (logado ? "Raiz" : null),
            message: `Pedido via assistente Aya.\n\nResumo: ${resumo}\n\nÚltima mensagem: ${ultima}`,
            profileId: user?.id ?? null,
          });
          escalated = true;
          toolMsgs.push({ role: "tool", tool_call_id: tc.id, name: tc.function.name, content: "OK, e-mail enviado para a equipe." });
        } else {
          toolMsgs.push({ role: "tool", tool_call_id: tc.id, name: tc.function.name, content: "Ferramenta não disponível." });
        }
      }
      // Segunda chamada para o modelo redigir a resposta final ao usuário.
      const second = await chat(apiKey, [...messages, choice, ...toolMsgs], false);
      const reply = second.choices?.[0]?.message?.content?.trim() || "Encaminhei para a nossa equipe. Em breve alguém fala com você.";
      await logInteracao(reply, escalated);
      return NextResponse.json({ reply, escalated }, { status: 200 });
    }

    const reply = choice?.content?.trim() || "Desculpa, não entendi. Pode reformular?";

    // Rede de segurança: às vezes o modelo ESCREVE que encaminhou para a equipe
    // mas não chama a ferramenta. Se a resposta afirma (no passado) que já
    // encaminhou/avisou/repassou o suporte, encaminhamos aqui de verdade. Assim o
    // que a Aya promete ao usuário sempre chega ao time e ao admin.
    const feito = /\b(j[áa]\s+)?(encaminhei|encaminhamos|encaminhad[ao]s?|repassei|repassamos|repassad[ao]s?|acionei|acionamos|acionad[ao]s?|avisei|avisamos|avisad[ao]s?|notifiquei|notificamos|notificad[ao]s?|registrei|registramos|abri(?:mos)?\s+(?:um\s+)?chamado)\b/i;
    const futuro = /\b(vou|posso|poder(?:ia|ei)|gostaria|quer que|deseja que|irei|vamos|poderemos)\b[^.?!]*\b(encaminh|repass|acion|avis|notific|registr|abri)/i;
    const contextoEquipe = /(equipe|suporte|time|atendimento humano)/i;
    const afirmaEncaminhou = feito.test(reply) && contextoEquipe.test(reply) && !futuro.test(reply);
    // Evita duplicar quando o modelo repete "já encaminhei" em turnos seguintes:
    // só a primeira afirmação da conversa dispara o encaminhamento.
    const jaAfirmouAntes = historico.some(
      (m) => m.role === "assistant" && feito.test(m.content) && contextoEquipe.test(m.content) && !futuro.test(m.content)
    );

    if (afirmaEncaminhou && !jaAfirmouAntes) {
      const ultsUser = historico.filter((m) => m.role === "user").slice(-3).map((m) => m.content).join("\n");
      try {
        await sendSupportRequest({
          name: contatoNome,
          email: contatoEmail,
          phone: contatoTelefone,
          plan: planoLabel || (logado ? "Raiz" : null),
          message: `Encaminhamento automático: a Aya disse à pessoa que passaria o caso para a equipe.\n\nResposta da Aya: ${reply}\n\nÚltimas mensagens da pessoa:\n${ultsUser}`,
          profileId: user?.id ?? null,
        });
        escalated = true;
      } catch { /* nunca derruba a resposta ao usuário */ }
    }

    await logInteracao(reply, escalated);
    return NextResponse.json({ reply, escalated }, { status: 200 });
  } catch (e) {
    let detalhe = (e as Error).message.slice(0, 160);
    // Diagnóstico: se o problema é o modelo, lista os modelos que a conta tem.
    if (/does not exist|do not have access|404|model/i.test(detalhe)) {
      try {
        const r = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(8_000),
        });
        const j = await r.json();
        const ids = ((j?.data ?? []) as { id: string }[]).map((m) => m.id).join(", ");
        detalhe += ` | Modelos da sua conta: ${ids || "nenhum retornado"}`;
      } catch {
        detalhe += " | (não consegui listar os modelos)";
      }
    }
    return NextResponse.json(
      { reply: "Tive um problema para responder agora. Tenta de novo em instantes, ou fale com a equipe pelo WhatsApp no rodapé.", error: detalhe },
      { status: 200 }
    );
  }
}

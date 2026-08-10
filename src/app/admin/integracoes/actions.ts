"use server";

import { requireAdmin } from "@/lib/auth";
import { getAccountInfo, isAsaasConfigured, asaasEnv } from "@/lib/payments/asaas";
import { getKommoAccount, getKommoPipelines, isKommoConfigured } from "@/lib/kommo/client";

export type TestState = { ok: boolean | null; message: string };

/** Lista os funis e etapas do Kommo, com os ids para colar nas variáveis. */
export async function listKommoPipelinesAction(_prev: TestState, _fd: FormData): Promise<TestState> {
  await requireAdmin();
  if (!process.env.KOMMO_SUBDOMAIN || !process.env.KOMMO_ACCESS_TOKEN) {
    return { ok: false, message: "Defina KOMMO_SUBDOMAIN e KOMMO_ACCESS_TOKEN primeiro." };
  }
  try {
    const funis = await getKommoPipelines();
    if (!funis.length) return { ok: false, message: "Nenhum funil encontrado na conta." };
    const txt = funis
      .map((f) => `Funil "${f.name}" → KOMMO_PIPELINE_ID=${f.id}\n` +
        f.stages.map((s) => `   • ${s.name} = ${s.id}`).join("\n"))
      .join("\n\n");
    return { ok: true, message: txt };
  } catch (e) {
    return { ok: false, message: `Falhou: ${(e as Error).message}` };
  }
}

/** Testa o token do Kommo com uma leitura da conta. Não cria nada. */
export async function testKommoAction(_prev: TestState, _fd: FormData): Promise<TestState> {
  await requireAdmin();
  if (!isKommoConfigured()) {
    return { ok: false, message: "Faltam variáveis do Kommo (subdomínio, token ou funil)." };
  }
  try {
    const acc = await getKommoAccount();
    return { ok: true, message: `Conectado ao Kommo — ${acc.name || acc.subdomain || "conta"}. Nenhum lead foi criado.` };
  } catch (e) {
    return { ok: false, message: `Falhou: ${(e as Error).message}` };
  }
}

/** Teste 1 — só leitura. Valida a chave sem criar cliente nem cobrança. */
export async function testConnectionAction(_prev: TestState, _fd: FormData): Promise<TestState> {
  await requireAdmin();
  if (!isAsaasConfigured()) {
    return { ok: false, message: "ASAAS_API_KEY não está definida nesta implantação." };
  }
  try {
    const acc = await getAccountInfo();
    const quem = acc.name || acc.email || "conta sem nome";
    return { ok: true, message: `Conectado em ${asaasEnv()} — ${quem}. Nenhum dado foi criado.` };
  } catch (e) {
    return { ok: false, message: `Falhou: ${(e as Error).message}` };
  }
}

/**
 * Teste 2 — dispara um evento sintético no nosso próprio webhook, com o token
 * do ambiente. Valida URL + token sem envolver o Asaas e sem mexer em ninguém
 * (o evento não bate com nenhuma assinatura, então é ignorado).
 */
export async function testWebhookAction(_prev: TestState, _fd: FormData): Promise<TestState> {
  await requireAdmin();
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!token) {
    return { ok: false, message: "ASAAS_WEBHOOK_TOKEN não está definida nesta implantação." };
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ayumana.com.br";
  const url = `${site}/api/webhooks/asaas`;
  const id = `teste-diagnostico-${Date.now()}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "asaas-access-token": token },
      body: JSON.stringify({ event: "PAYMENT_CREATED", id, payment: { id } }),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
      return { ok: false, message: "401: o token da Vercel não bate com o do webhook no Asaas." };
    }
    if (!res.ok) {
      return { ok: false, message: `Webhook respondeu ${res.status}. URL: ${url}` };
    }
    return {
      ok: true,
      message: `Webhook acessível e token correto (${url}). Resposta: ${JSON.stringify(body)}. Nenhum plano foi alterado.`,
    };
  } catch (e) {
    return { ok: false, message: `Não consegui alcançar ${url}: ${(e as Error).message}` };
  }
}

import "server-only";

/**
 * Adapter do Asaas. Implementa as chamadas reais da API; fica inerte até
 * ASAAS_API_KEY estar definido (modo "pronto pra plugar").
 * Docs: https://docs.asaas.com/
 */

const API_KEY = process.env.ASAAS_API_KEY;
const ENV = process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
const BASE =
  ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

export function isAsaasConfigured(): boolean {
  return !!API_KEY;
}

type AsaasFetchOpts = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
};

async function asaas<T>(path: string, opts: AsaasFetchOpts = {}): Promise<T> {
  if (!API_KEY) throw new Error("ASAAS_API_KEY não configurada.");
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      access_token: API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "Ayumana",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data?.errors?.[0]?.description as string) ||
      `Asaas ${res.status} em ${path}`;
    throw new Error(msg);
  }
  return data as T;
}

/** Chamada só de leitura, para validar a chave sem criar nada. */
export async function getAccountInfo(): Promise<{
  name?: string;
  email?: string;
  companyType?: string;
}> {
  return asaas("/myAccount");
}

/** Ambiente configurado (sandbox|production). */
export function asaasEnv(): "sandbox" | "production" {
  return ENV;
}

/** Cria (ou reaproveita) o cliente Asaas do profissional. */
export async function ensureCustomer(params: {
  existingId?: string | null;
  name: string;
  email: string;
  cpfCnpj?: string | null;
}): Promise<string> {
  if (params.existingId) return params.existingId;
  const data = await asaas<{ id: string }>("/customers", {
    method: "POST",
    body: {
      name: params.name,
      email: params.email,
      ...(params.cpfCnpj ? { cpfCnpj: params.cpfCnpj } : {}),
    },
  });
  return data.id;
}

/** Cria uma assinatura mensal e devolve id + URL de checkout da 1ª cobrança. */
export async function createSubscription(params: {
  customerId: string;
  valueReais: number;
  description: string;
  externalReference: string;
}): Promise<{ subscriptionId: string; checkoutUrl: string | null }> {
  const nextDueDate = isoDatePlusDays(0);
  const sub = await asaas<{ id: string }>("/subscriptions", {
    method: "POST",
    body: {
      customer: params.customerId,
      billingType: "UNDEFINED", // deixa o cliente escolher Pix/boleto/cartão
      value: params.valueReais,
      nextDueDate,
      cycle: "MONTHLY",
      description: params.description,
      externalReference: params.externalReference,
    },
  });

  // Busca a primeira cobrança para redirecionar ao checkout.
  let checkoutUrl: string | null = null;
  try {
    const payments = await asaas<{ data: { invoiceUrl?: string }[] }>(
      `/subscriptions/${sub.id}/payments`
    );
    checkoutUrl = payments.data?.[0]?.invoiceUrl ?? null;
  } catch {
    checkoutUrl = null;
  }

  return { subscriptionId: sub.id, checkoutUrl };
}

/** Cancela a assinatura no Asaas. */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaas(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

function isoDatePlusDays(days: number): string {
  // Sem Date.now direto aqui não é possível; usamos new Date() (permitido no runtime Next).
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

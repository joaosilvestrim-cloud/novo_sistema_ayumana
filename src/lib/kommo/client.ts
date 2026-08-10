import "server-only";

/**
 * Adapter do Kommo (CRM). Fica inerte até as variáveis estarem definidas,
 * no mesmo estilo "pronto pra plugar" do Asaas.
 * Docs: https://www.kommo.com/developers/content/crm_platform/api-reference/
 *
 * Variáveis:
 *   KOMMO_SUBDOMAIN     ex.: "a2f" (de a2f.kommo.com)
 *   KOMMO_ACCESS_TOKEN  token de longa duração da integração privada
 *   KOMMO_PIPELINE_ID   id do funil onde os leads entram
 *   KOMMO_STAGE_CADASTRO / _TESTE / _COMPRA / _CANCELADO  ids das etapas
 */

const SUB = process.env.KOMMO_SUBDOMAIN;
const TOKEN = process.env.KOMMO_ACCESS_TOKEN;
const BASE = SUB ? `https://${SUB}.kommo.com/api/v4` : "";

export type KommoStageKey = "cadastro" | "teste" | "compra" | "cancelado";

export function pipelineId(): number {
  return Number(process.env.KOMMO_PIPELINE_ID ?? 0) || 0;
}

export function stageId(key: KommoStageKey): number {
  const map: Record<KommoStageKey, string | undefined> = {
    cadastro: process.env.KOMMO_STAGE_CADASTRO,
    teste: process.env.KOMMO_STAGE_TESTE,
    compra: process.env.KOMMO_STAGE_COMPRA,
    cancelado: process.env.KOMMO_STAGE_CANCELADO,
  };
  return Number(map[key] ?? 0) || 0;
}

export function isKommoConfigured(): boolean {
  return !!(SUB && TOKEN && pipelineId());
}

async function kommo<T>(path: string, opts: { method?: "GET" | "POST" | "PATCH"; body?: unknown } = {}): Promise<T> {
  if (!SUB || !TOKEN) throw new Error("Kommo não configurado.");
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 204) return {} as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { title?: string; detail?: string })?.detail
      || (data as { title?: string })?.title
      || `Kommo ${res.status} em ${path}`;
    throw new Error(msg);
  }
  return data as T;
}

/** Leitura simples, para validar o token no diagnóstico. */
export async function getKommoAccount(): Promise<{ id?: number; name?: string; subdomain?: string }> {
  return kommo("/account");
}

type PipelinesResponse = {
  _embedded?: {
    pipelines?: {
      id: number;
      name: string;
      _embedded?: { statuses?: { id: number; name: string }[] };
    }[];
  };
};

/** Lista funis e etapas com seus ids, para copiar nas variáveis de ambiente. */
export async function getKommoPipelines(): Promise<
  { id: number; name: string; stages: { id: number; name: string }[] }[]
> {
  const data = await kommo<PipelinesResponse>("/leads/pipelines");
  return (data._embedded?.pipelines ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    stages: (p._embedded?.statuses ?? []).map((s) => ({ id: s.id, name: s.name })),
  }));
}

type ComplexResponse = { id: number; contact_id?: number }[];

/**
 * Cria um lead junto com o contato, em uma chamada. Devolve os ids para
 * guardarmos e reusarmos nos próximos eventos.
 */
export async function createLeadWithContact(params: {
  name: string;
  price?: number;
  statusId: number;
  contact: { name: string; email?: string | null; phone?: string | null };
}): Promise<{ leadId: string; contactId: string | null }> {
  const cf: unknown[] = [];
  if (params.contact.email) {
    cf.push({ field_code: "EMAIL", values: [{ value: params.contact.email, enum_code: "WORK" }] });
  }
  if (params.contact.phone) {
    cf.push({ field_code: "PHONE", values: [{ value: params.contact.phone, enum_code: "WORK" }] });
  }

  const body = [
    {
      name: params.name,
      ...(params.price ? { price: params.price } : {}),
      pipeline_id: pipelineId(),
      status_id: params.statusId,
      _embedded: {
        contacts: [{ name: params.contact.name, ...(cf.length ? { custom_fields_values: cf } : {}) }],
      },
    },
  ];

  const data = await kommo<ComplexResponse>("/leads/complex", { method: "POST", body });
  const first = data?.[0];
  return { leadId: String(first?.id), contactId: first?.contact_id != null ? String(first.contact_id) : null };
}

/** Move o lead para outra etapa do funil (e ajusta o valor, se informado). */
export async function moveLead(leadId: string, statusId: number, price?: number): Promise<void> {
  await kommo(`/leads/${leadId}`, {
    method: "PATCH",
    body: { pipeline_id: pipelineId(), status_id: statusId, ...(price ? { price } : {}) },
  });
}

/** Adiciona uma nota ao lead, para registrar o que aconteceu. */
export async function addLeadNote(leadId: string, text: string): Promise<void> {
  await kommo(`/leads/${leadId}/notes`, {
    method: "POST",
    body: [{ note_type: "common", params: { text } }],
  });
}

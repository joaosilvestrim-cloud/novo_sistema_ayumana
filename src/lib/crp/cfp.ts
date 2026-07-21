import "server-only";

/**
 * Consulta ao Cadastro Nacional de Psicólogas(os) do CFP.
 *
 * O CFP não publica API aberta: o endpoint oficial (cn-api.cfp.org.br/psi/busca)
 * exige reCAPTCHA. Por isso a consulta passa por um provedor comercial que já
 * mantém essa integração. Hoje o provedor suportado é a Infosimples.
 *
 * Sem token configurado, a função devolve "nao_configurado" e o fluxo segue
 * com a conferência manual do documento pelo admin — nada quebra.
 */

export type CfpStatus =
  | "ativo"            // registro encontrado e regular
  | "irregular"        // encontrado, mas cancelado/suspenso/transferido
  | "nao_encontrado"   // não existe registro com esse número/UF
  | "erro"             // falha de rede, timeout, token inválido
  | "nao_configurado"; // provedor não habilitado

export type CfpResult = {
  status: CfpStatus;
  nome?: string | null;
  situacao?: string | null;
  regional?: string | null;
  dataInscricao?: string | null;
  mensagem?: string | null;
  payload?: unknown;
};

const ENDPOINT =
  process.env.INFOSIMPLES_CFP_URL ||
  "https://api.infosimples.com/api/v2/consultas/cfp/cadastro";

export function cfpConfigured(): boolean {
  return !!process.env.INFOSIMPLES_TOKEN;
}

/** "06/153352" -> "153352". Aceita também o número puro. */
export function apenasRegistro(crp: string): string {
  const partes = crp.split("/");
  const n = (partes[1] ?? partes[0] ?? "").replace(/\D/g, "");
  return n.replace(/^0+/, "") || n;
}

/** Situação textual do conselho -> status normalizado. */
function normalizaSituacao(situacao: string | null | undefined): CfpStatus {
  const s = (situacao || "").toLowerCase();
  if (!s) return "nao_encontrado";
  if (s.includes("ativ") || s.includes("regular")) return "ativo";
  return "irregular";
}

type InfosimplesResponse = {
  code?: number;
  code_message?: string;
  data?: Array<Record<string, unknown>>;
  errors?: unknown;
};

export async function consultarCfp(input: {
  registro: string;
  uf: string;
  nome?: string | null;
  timeoutMs?: number;
}): Promise<CfpResult> {
  const token = process.env.INFOSIMPLES_TOKEN;
  if (!token) {
    return { status: "nao_configurado", mensagem: "Consulta automática ao CFP não habilitada." };
  }

  const registro = apenasRegistro(input.registro);
  const uf = (input.uf || "").trim().toUpperCase();
  if (!registro || !uf) {
    return { status: "erro", mensagem: "CRP ou UF ausente." };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token, timeout: 20, registro, uf }),
      cache: "no-store",
      signal: AbortSignal.timeout(input.timeoutMs ?? 30_000),
    });

    const json = (await res.json().catch(() => null)) as InfosimplesResponse | null;
    if (!json) {
      return { status: "erro", mensagem: `Resposta inválida do provedor (HTTP ${res.status}).` };
    }

    // A Infosimples devolve 200 no sucesso; 6xx são erros de consulta.
    if (json.code !== 200) {
      const msg = json.code_message || `Código ${json.code} do provedor.`;
      // "não encontrado" é resultado válido, não falha de integração.
      const naoAchou = /n[ãa]o\s+(foi\s+)?encontrad/i.test(msg) || /sem\s+resultado/i.test(msg);
      return { status: naoAchou ? "nao_encontrado" : "erro", mensagem: msg, payload: json };
    }

    const item = json.data?.[0];
    if (!item) {
      return { status: "nao_encontrado", mensagem: "Registro não localizado no CFP.", payload: json };
    }

    const situacao = (item.situacao as string) ?? null;
    return {
      status: normalizaSituacao(situacao),
      nome: (item.nome as string) ?? null,
      situacao,
      regional: (item.nome_regional as string) ?? null,
      dataInscricao: (item.data_inscricao as string) ?? null,
      payload: json,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao consultar o CFP.";
    return { status: "erro", mensagem: msg };
  }
}

export const CFP_STATUS_LABEL: Record<CfpStatus, string> = {
  ativo: "Ativo no CFP",
  irregular: "Irregular no CFP",
  nao_encontrado: "Não encontrado no CFP",
  erro: "Falha na consulta",
  nao_configurado: "Consulta não habilitada",
};

/** Compara o nome do cadastro com o nome do conselho, ignorando acento e caixa. */
export function nomesBatem(a: string | null | undefined, b: string | null | undefined): boolean {
  const limpa = (s: string | null | undefined) =>
    (s || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z ]/g, "")
      .split(/\s+/)
      .filter(Boolean);
  const x = limpa(a);
  const y = limpa(b);
  if (!x.length || !y.length) return false;
  // Primeiro e último nome iguais já bastam (nome social, abreviações no meio).
  return x[0] === y[0] && x[x.length - 1] === y[y.length - 1];
}

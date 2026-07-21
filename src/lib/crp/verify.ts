import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { consultarCfp, nomesBatem, type CfpResult } from "@/lib/crp/cfp";

export type VerifyOutcome = CfpResult & {
  /** true quando o nome do cadastro bate com o nome do conselho. */
  nomeConfere: boolean;
};

/**
 * Consulta o CFP para um psicólogo e grava o resultado nas colunas crp_auto_*.
 * Não muda verification_status: a decisão de aprovar continua sendo do admin,
 * agora com a resposta oficial na tela.
 */
export async function verificarCrpNoCfp(
  psyId: string,
  opts: { timeoutMs?: number } = {}
): Promise<VerifyOutcome | null> {
  const admin = createAdminClient();
  const { data: psy } = await admin
    .from("psychologists")
    .select("id, display_name, crp_number, crp_uf")
    .eq("id", psyId)
    .maybeSingle();

  if (!psy?.crp_number || !psy?.crp_uf) return null;

  const res = await consultarCfp({
    registro: psy.crp_number as string,
    uf: psy.crp_uf as string,
    nome: psy.display_name as string | null,
    timeoutMs: opts.timeoutMs,
  });

  const nomeConfere = nomesBatem(psy.display_name as string | null, res.nome);

  await admin
    .from("psychologists")
    .update({
      crp_auto_status: res.status,
      crp_auto_nome: res.nome ?? null,
      crp_auto_situacao: res.situacao ?? res.mensagem ?? null,
      crp_auto_checked_at: new Date().toISOString(),
      crp_auto_payload: (res.payload ?? null) as never,
    })
    .eq("id", psyId);

  return { ...res, nomeConfere };
}

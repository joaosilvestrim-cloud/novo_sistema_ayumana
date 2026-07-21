import { FileText, MapPin, ExternalLink, RefreshCw, ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { VERIFICATION_LABELS } from "@/lib/types";
import { cfpConfigured, nomesBatem, type CfpStatus } from "@/lib/crp/cfp";
import { approveAction, rejectAction, checkCfpAction, checkCfpBatchAction } from "./actions";

export const metadata = { title: "Verificação de CRP" };

const BUCKET = process.env.SUPABASE_CRP_BUCKET || "crp-documentos";

type Row = {
  id: string;
  display_name: string | null;
  crp_number: string | null;
  crp_uf: string | null;
  crp_document_path: string | null;
  city: string | null;
  state: string | null;
  verification_status: string;
  verification_submitted_at: string | null;
  profile_completed: boolean;
  crp_auto_status: CfpStatus | null;
  crp_auto_nome: string | null;
  crp_auto_situacao: string | null;
  crp_auto_checked_at: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

/** Faixa colorida com o resultado da consulta oficial ao CFP. */
function CfpBanner({ r }: { r: Row }) {
  const nome = r.display_name || r.profiles?.full_name || null;
  const confere = nomesBatem(nome, r.crp_auto_nome);

  if (!r.crp_auto_checked_at) {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
        <ShieldQuestion className="h-4 w-4 shrink-0" />
        Ainda não consultado no CFP.
      </p>
    );
  }

  const quando = new Date(r.crp_auto_checked_at).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const ok = r.crp_auto_status === "ativo";
  const ruim = r.crp_auto_status === "irregular" || r.crp_auto_status === "nao_encontrado";

  const texto =
    r.crp_auto_status === "ativo"
      ? `Registro ATIVO no CFP em nome de ${r.crp_auto_nome || "—"}.`
      : r.crp_auto_status === "irregular"
        ? `Registro encontrado, mas a situação é "${r.crp_auto_situacao}".`
        : r.crp_auto_status === "nao_encontrado"
          ? "Nenhum registro com esse número e UF no CFP."
          : r.crp_auto_status === "nao_configurado"
            ? "Consulta automática não habilitada (falta o token do provedor)."
            : `Falha ao consultar: ${r.crp_auto_situacao || "erro desconhecido"}.`;

  const cor = ok
    ? "border-green-600/40 bg-green-50 text-green-800"
    : ruim
      ? "border-danger/40 bg-danger/10 text-danger"
      : "border-yellow-500/40 bg-yellow-400/10 text-yellow-800";

  const Icone = ok ? ShieldCheck : ruim ? ShieldAlert : ShieldQuestion;

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${cor}`}>
      <p className="flex items-center gap-2">
        <Icone className="h-4 w-4 shrink-0" />
        <span>{texto}</span>
      </p>
      {ok && !confere && (
        <p className="mt-1 pl-6 text-xs font-medium">
          Atenção: o nome do cadastro ({nome || "—"}) não bate com o do conselho.
        </p>
      )}
      <p className="mt-1 pl-6 text-xs opacity-80">Consultado em {quando}.</p>
    </div>
  );
}

export default async function VerificacaoPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("psychologists")
    .select(
      "id, display_name, crp_number, crp_uf, crp_document_path, city, state, verification_status, verification_submitted_at, profile_completed, crp_auto_status, crp_auto_nome, crp_auto_situacao, crp_auto_checked_at, profiles!psychologists_profile_id_fkey(full_name, email)"
    )
    .eq("verification_status", "pendente")
    .order("verification_submitted_at", { ascending: true });

  const rows = (data as Row[] | null) ?? [];

  // URLs assinadas para os documentos.
  const signed: Record<string, string> = {};
  await Promise.all(
    rows.map(async (r) => {
      if (r.crp_document_path) {
        const { data: s } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(r.crp_document_path, 600);
        if (s?.signedUrl) signed[r.id] = s.signedUrl;
      }
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Verificação de CRP</h1>
          <p className="mt-1 text-foreground-muted">
            Valide o registro no Cadastro Nacional de Psicólogos e aprove os
            perfis pendentes.
          </p>
        </div>
        <Badge tone="warning">{rows.length} pendente(s)</Badge>
      </div>

      {!cfpConfigured() ? (
        <p className="rounded-xl border border-yellow-500/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-800">
          A consulta automática ao CFP está desligada. Configure{" "}
          <code>INFOSIMPLES_TOKEN</code> para validar o CRP direto no Cadastro Nacional.
          Enquanto isso, a conferência continua manual pelo documento.
        </p>
      ) : (
        <form action={checkCfpBatchAction} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
          <span className="text-sm text-foreground-muted">
            Consultar no CFP quem ainda não foi checado:
          </span>
          <select name="limite" defaultValue="25" className="h-8 rounded-md border border-border bg-background px-2 text-sm">
            <option value="10">10 por vez</option>
            <option value="25">25 por vez</option>
            <option value="50">50 por vez</option>
          </select>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-muted">
            <RefreshCw className="h-3.5 w-3.5" /> Consultar em lote
          </button>
          <span className="text-xs text-foreground-muted">cada consulta é cobrada pelo provedor</span>
        </form>
      )}

      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          Erro ao carregar. Verifique se as migrations foram aplicadas. ({error.message})
        </p>
      )}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-12 text-center text-foreground-muted">
          Nenhuma verificação pendente. 🎉
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const v = VERIFICATION_LABELS[r.verification_status as keyof typeof VERIFICATION_LABELS];
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-background p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg">
                        {r.display_name || r.profiles?.full_name || "Sem nome"}
                      </h2>
                      <Badge tone={v.tone}>{v.label}</Badge>
                      {!r.profile_completed && (
                        <Badge tone="neutral">Perfil incompleto</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted">
                      {r.profiles?.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        <span className="text-foreground-muted">CRP: </span>
                        <strong>{r.crp_number || "—"}</strong>
                        {r.crp_uf ? `/${r.crp_uf}` : ""}
                      </span>
                      {(r.city || r.state) && (
                        <span className="inline-flex items-center gap-1 text-foreground-muted">
                          <MapPin className="h-3.5 w-3.5" />
                          {[r.city, r.state].filter(Boolean).join(" / ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {signed[r.id] ? (
                    <a
                      href={signed[r.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-heading hover:bg-surface-muted"
                    >
                      <FileText className="h-4 w-4" />
                      Ver documento
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-danger">Sem documento</span>
                  )}
                </div>

                <CfpBanner r={r} />

                {/* Ações */}
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-border pt-5">
                  <form action={checkCfpAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-muted">
                      <RefreshCw className="h-4 w-4" /> Consultar CFP
                    </button>
                  </form>

                  <form action={approveAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
                      Aprovar e publicar
                    </button>
                  </form>

                  <form action={rejectAction} className="flex flex-1 items-end gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="notes"
                      placeholder="Motivo da reprovação (enviado ao psicólogo)"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-danger"
                    />
                    <button className="h-10 rounded-lg border border-danger px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/10">
                      Reprovar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

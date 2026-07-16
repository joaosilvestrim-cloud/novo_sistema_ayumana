import { FileText, MapPin, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { VERIFICATION_LABELS } from "@/lib/types";
import { approveAction, rejectAction } from "./actions";

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
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function VerificacaoPage() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("psychologists")
    .select(
      "id, display_name, crp_number, crp_uf, crp_document_path, city, state, verification_status, verification_submitted_at, profile_completed, profiles!psychologists_profile_id_fkey(full_name, email)"
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

                {/* Ações */}
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-border pt-5">
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

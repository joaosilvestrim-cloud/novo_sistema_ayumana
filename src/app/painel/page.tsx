import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import { getMyPsychologist, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShareProfile } from "@/components/share-profile";
import { VERIFICATION_LABELS, type Plan } from "@/lib/types";

export default async function PainelHome() {
  const profile = await getProfile();
  const psy = await getMyPsychologist();

  const supabase = await createClient();
  const { data: plan } = psy
    ? await supabase
        .from("plans")
        .select("*")
        .eq("id", psy.plan_tier)
        .single<Plan>()
    : { data: null };

  const firstName = (profile?.full_name || "").split(" ")[0];
  const status = psy?.verification_status ?? "nao_enviado";
  const v = VERIFICATION_LABELS[status];

  const steps = [
    {
      done: !!psy?.display_name && !!psy?.city,
      label: "Preencher dados do perfil",
    },
    { done: !!psy?.crp_document_path, label: "Enviar documento de CRP" },
    { done: !!psy?.bio && !!psy?.headline, label: "Escrever apresentação" },
    { done: status === "aprovado", label: "Verificação aprovada" },
    { done: !!psy?.is_published, label: "Perfil publicado na busca" },
  ];
  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Olá{firstName ? `, ${firstName}` : ""} 👋</h1>
        <p className="mt-1 text-foreground-muted">
          Acompanhe seu perfil e sua verificação de CRP.
        </p>
      </div>

      {/* Status de verificação */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {status === "aprovado" ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : status === "reprovado" ? (
              <AlertCircle className="h-6 w-6 text-danger" />
            ) : (
              <Clock className="h-6 w-6 text-yellow-500" />
            )}
            <div>
              <p className="font-medium text-heading">Verificação de CRP</p>
              <Badge tone={v.tone}>{v.label}</Badge>
            </div>
          </div>
          {status !== "aprovado" && (
            <Button href="/painel/onboarding" size="sm">
              {psy ? "Continuar cadastro" : "Começar cadastro"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {status === "reprovado" && psy?.verification_notes && (
          <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            Motivo: {psy.verification_notes}
          </p>
        )}
        {status === "pendente" && (
          <p className="mt-4 text-sm text-foreground-muted">
            Recebemos seus dados. Nossa equipe valida seu CRP no Cadastro
            Nacional de Psicólogos — normalmente em até 2 dias úteis.
          </p>
        )}
      </div>

      {/* Progresso */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-medium text-heading">Seu progresso</p>
          <span className="text-sm text-foreground-muted">
            {completed}/{steps.length}
          </span>
        </div>
        <ul className="space-y-2.5">
          {steps.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5 text-sm">
              <CheckCircle2
                className={
                  s.done
                    ? "h-4 w-4 text-green-600"
                    : "h-4 w-4 text-neutral-300"
                }
              />
              <span className={s.done ? "text-foreground" : "text-foreground-muted"}>
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Compartilhar perfil (quando publicado) */}
      {psy?.is_published && psy.slug && (
        <ShareProfile slug={psy.slug} name={psy.display_name} variant="card" />
      )}

      {/* Plano atual */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-teal-600" />
            <div>
              <p className="font-medium text-heading">
                Plano {plan?.name ?? "Essencial"}
              </p>
              <p className="text-sm text-foreground-muted">
                {plan?.price_label ?? "Grátis"}
              </p>
            </div>
          </div>
          <Link
            href="/painel/assinatura"
            className="text-sm font-medium text-brand-dark hover:underline"
          >
            Gerenciar
          </Link>
        </div>
      </div>
    </div>
  );
}

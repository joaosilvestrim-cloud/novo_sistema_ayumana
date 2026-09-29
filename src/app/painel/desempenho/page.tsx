import Link from "next/link";
import { Eye, MessageCircle, Lock, Share2, TrendingUp, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { getMyPsychologist } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan } from "@/lib/plan-features";
import { avaliarCompletude, type CompletudeInput } from "@/lib/profile-completeness";
import { ShareProfile } from "@/components/share-profile";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Meu desempenho" };

export default async function DesempenhoPage() {
  const psy = await getMyPsychologist();
  const plano = psy ? effectivePlan(psy) : "essencial";
  const pago = plano !== "essencial"; // Alcance, Voz ou Presença
  const publicado = !!psy?.is_published;

  const admin = createAdminClient();

  // Existência de temas e abordagens (para a régua de completude).
  let hasApproaches = false, hasSpecialties = false;
  if (psy?.id) {
    const [{ count: apr }, { count: esp }] = await Promise.all([
      admin.from("psychologist_approaches").select("*", { count: "exact", head: true }).eq("psychologist_id", psy.id),
      admin.from("psychologist_specialties").select("*", { count: "exact", head: true }).eq("psychologist_id", psy.id),
    ]);
    hasApproaches = (apr ?? 0) > 0;
    hasSpecialties = (esp ?? 0) > 0;
  }

  const input: CompletudeInput = {
    display_name: psy?.display_name ?? null,
    crp_number: psy?.crp_number ?? null,
    crp_uf: psy?.crp_uf ?? null,
    crp_document_path: psy?.crp_document_path ?? null,
    headline: psy?.headline ?? null,
    bio: psy?.bio ?? null,
    avatar_url: psy?.avatar_url ?? null,
    city: psy?.city ?? null,
    phone_whatsapp: psy?.phone_whatsapp ?? null,
    session_price_cents: psy?.session_price_cents ?? null,
    video_url: psy?.video_url ?? null,
    hasApproaches,
    hasSpecialties,
  };
  const comp = avaliarCompletude(input);

  // Números reais, só para quem já é publicado e está em plano pago.
  let views = 0, contatos = 0;
  if (publicado && pago && psy?.slug) {
    const path = `/psicologo/${psy.slug}`;
    const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [{ count: v }, { count: c }] = await Promise.all([
      admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "pageview").eq("path", path).gte("created_at", since30),
      admin.from("analytics_events").select("*", { count: "exact", head: true }).eq("type", "click").eq("path", path).ilike("label", "%wa.me%").gte("created_at", since30),
    ]);
    views = v ?? 0;
    contatos = c ?? 0;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl"><TrendingUp className="h-6 w-6 text-brand-dark" /> Meu desempenho</h1>
        <p className="mt-1 text-foreground-muted">Como seu perfil está indo e o que fazer para aparecer mais.</p>
      </div>

      {/* Perfil fora do ar: foco em publicar, sem números */}
      {!publicado && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-400/10 p-6">
          <p className="flex items-center gap-2 font-medium text-heading"><AlertCircle className="h-5 w-5 text-yellow-600" /> Seu perfil ainda não está no ar</p>
          <p className="mt-1 text-sm text-foreground-muted">
            Ele só aparece na busca depois de completo e verificado. Falta:
          </p>
          <ul className="mt-3 space-y-1.5">
            {comp.faltaObrigatorio.length === 0 ? (
              <li className="text-sm text-foreground-muted">Seus dados estão completos. Aguarde a verificação do CRP pela equipe.</li>
            ) : comp.faltaObrigatorio.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-sm text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" /> {c.label}{c.dica ? ` (${c.dica})` : ""}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button href="/painel/onboarding" size="sm">Completar meu perfil <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Números: plano pago vê de verdade; grátis vê o convite */}
      {publicado && (
        pago ? (
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-foreground-muted">Nos últimos 30 dias</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface-muted/40 p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800"><Eye className="h-5 w-5" /></div>
                <p className="mt-3 text-3xl font-semibold text-heading">{views}</p>
                <p className="text-sm text-foreground-muted">Pessoas que viram seu perfil</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted/40 p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-800"><MessageCircle className="h-5 w-5" /></div>
                <p className="mt-3 text-3xl font-semibold text-heading">{contatos}</p>
                <p className="text-sm text-foreground-muted">Cliques no seu WhatsApp</p>
              </div>
            </div>
            {views + contatos === 0 && (
              <p className="mt-4 rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
                Ainda não registramos visitas neste período. Divulgue o link do seu perfil e siga as dicas abaixo. O movimento cresce com o perfil completo e a divulgação.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6">
            <p className="flex items-center gap-2 font-medium text-heading"><Lock className="h-5 w-5 text-brand-dark" /> Veja quantas pessoas visitam seu perfil</p>
            <p className="mt-1 text-sm text-foreground-muted">
              O acompanhamento de visitas e contatos no WhatsApp faz parte dos planos pagos. Assim você vê o retorno do seu perfil e o que está funcionando.
            </p>
            <div className="mt-4">
              <Button href="/painel/assinatura" size="sm">Ver planos <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )
      )}

      {/* Como ser mais visto: vale para todos */}
      <div className="rounded-2xl border border-border bg-background p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-heading">Como ser mais visto</p>
          <span className="text-sm text-foreground-muted">{comp.percent}% do perfil pronto</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand-dark" style={{ width: `${comp.percent}%` }} />
        </div>

        {comp.faltaRecomendado.length > 0 ? (
          <>
            <p className="mt-4 text-sm text-foreground-muted">Complete estes itens para aparecer mais e receber mais contatos:</p>
            <ul className="mt-2 space-y-2">
              {comp.faltaRecomendado.map((c) => (
                <li key={c.key} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="text-foreground">{c.label}{c.dica ? <span className="text-foreground-muted"> — {c.dica}</span> : null}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" /> Seu perfil está completíssimo. Agora é divulgar!</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button href="/painel/onboarding" size="sm" variant="secondary">Editar meu perfil</Button>
          {plano === "essencial" && (
            <Button href="/painel/assinatura" size="sm" variant="secondary">Aparecer mais com o Alcance</Button>
          )}
        </div>
      </div>

      {/* Compartilhar */}
      {publicado && psy?.slug && (
        <div className="rounded-2xl border border-border bg-background p-6">
          <p className="flex items-center gap-2 font-medium text-heading"><Share2 className="h-5 w-5 text-brand-dark" /> Divulgue seu perfil</p>
          <p className="mt-1 mb-3 text-sm text-foreground-muted">Boa parte dos contatos vem de você compartilhando seu link nas redes e no WhatsApp.</p>
          <ShareProfile slug={psy.slug} name={psy.display_name} variant="card" />
        </div>
      )}
    </div>
  );
}

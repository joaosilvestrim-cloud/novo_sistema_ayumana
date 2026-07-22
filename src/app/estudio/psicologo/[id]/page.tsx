import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles, Plus, AlertTriangle, CheckCircle2, Hourglass } from "lucide-react";
import {
  getStudioClient, listItemsDetailed, listCycles, currentCycle, cycleLabel,
  resumoCiclo, PECAS_POR_CICLO,
} from "@/lib/studio";
import { AvatarBubble } from "@/components/ui/avatar-bubble";
import { StudioBoard } from "@/components/studio/board";
import { generateCycleAction, createItemAction } from "@/app/estudio/actions";

export default async function ClienteBoard({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const client = await getStudioClient(id);
  if (!client) notFound();

  const cycles = await listCycles(id);
  const cycle = sp.cycle && cycles.includes(sp.cycle) ? sp.cycle : currentCycle();
  const items = await listItemsDetailed(id, cycle);
  const r = resumoCiclo(items);
  const mensagensNovas = items.reduce((s, i) => s + i.novasParaEstudio, 0);

  return (
    <div className="space-y-5">
      <Link href="/estudio" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Cabeçalho do cliente com o pulso do ciclo */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <AvatarBubble src={client.avatar_url} name={client.display_name} seed={client.id} size={110} className="w-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl">{client.display_name || "—"}</h1>
            <p className="text-sm text-foreground-muted">{client.city || "—"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {client.instagram && (
              <a href={`https://instagram.com/${client.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-surface-muted">
                <ExternalLink className="h-4 w-4" /> @{client.instagram}
              </a>
            )}
            {client.slug && (
              <a href={`/psicologo/${client.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-surface-muted">
                <ExternalLink className="h-4 w-4" /> Ver perfil
              </a>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-heading">
                {r.prontas} de {r.total} peças entregues em {cycleLabel(cycle)}
              </span>
              <span className="text-foreground-muted">{r.progresso}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-[var(--ayu-verde,#73A533)] transition-all" style={{ width: `${r.progresso}%` }} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {r.comVoce > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 font-medium text-amber-900">
                  <Hourglass className="h-3.5 w-3.5" /> {r.comVoce} esperando o psicólogo
                </span>
              )}
              {mensagensNovas > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand/15 px-2.5 py-1 font-medium text-brand-dark">
                  {mensagensNovas} mensagem(ns) sem ler
                </span>
              )}
              {r.atrasadas > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 font-medium text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> {r.atrasadas} fora do prazo
                </span>
              )}
              {r.comVoce === 0 && r.atrasadas === 0 && mensagensNovas === 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-lime-50 px-2.5 py-1 font-medium text-lime-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Nada travado por aqui
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Competência */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground-muted">Competência:</span>
        {cycles.map((c) => (
          <Link key={c} href={`/estudio/psicologo/${id}?cycle=${c}`} className={`rounded-full px-3 py-1 text-sm font-medium ${c === cycle ? "bg-brand text-white" : "border border-border text-foreground-muted hover:bg-surface-muted"}`}>
            {cycleLabel(c)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
          <p className="text-heading">Nenhuma peça em {cycleLabel(cycle)}.</p>
          <p className="mt-1 text-sm text-foreground-muted">Gere o ciclo com {PECAS_POR_CICLO} peças ou crie peças avulsas.</p>
          <form action={generateCycleAction} className="mt-4 inline-block">
            <input type="hidden" name="psy_id" value={id} />
            <input type="hidden" name="cycle" value={cycle} />
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
              <Sparkles className="h-4 w-4" /> Gerar ciclo ({PECAS_POR_CICLO} peças)
            </button>
          </form>
        </div>
      ) : (
        <>
          <form action={createItemAction} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3">
            <input type="hidden" name="psy_id" value={id} />
            <input type="hidden" name="cycle" value={cycle} />
            <input name="title" placeholder="Título da nova peça" className="h-9 min-w-[180px] flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
            <select name="format" className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
              <option value="post">Post</option><option value="story">Story</option><option value="reel">Reel</option><option value="carrossel">Carrossel</option><option value="outro">Outro</option>
            </select>
            <button className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </form>

          <StudioBoard items={items} psyId={id} psyNome={client.display_name} />
        </>
      )}
    </div>
  );
}

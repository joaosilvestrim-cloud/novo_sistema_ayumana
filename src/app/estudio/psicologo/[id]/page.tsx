import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles, Plus } from "lucide-react";
import { getStudioClient, listItems, listCycles, currentCycle, cycleLabel, PECAS_POR_CICLO } from "@/lib/studio";
import { AvatarBubble } from "@/components/ui/avatar-bubble";
import { ContentCard } from "@/components/studio/content-card";
import { CONTENT_STATUS } from "@/lib/types";
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
  const items = await listItems(id, cycle);

  return (
    <div className="space-y-6">
      <Link href="/estudio" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-heading">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Cabeçalho do cliente */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 sm:flex-row sm:items-center">
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

      {/* Seletor de competência */}
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
          {/* Nova peça avulsa */}
          <form action={createItemAction} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3">
            <input type="hidden" name="psy_id" value={id} />
            <input type="hidden" name="cycle" value={cycle} />
            <input name="title" placeholder="Título da nova peça" className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm" />
            <select name="format" className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
              <option value="post">Post</option><option value="story">Story</option><option value="reel">Reel</option><option value="carrossel">Carrossel</option><option value="outro">Outro</option>
            </select>
            <button className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </form>

          {/* Kanban por status */}
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {CONTENT_STATUS.map((col) => {
              const cards = items.filter((i) => i.status === col.key);
              return (
                <div key={col.key} className="rounded-2xl bg-surface-muted/40 p-2">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{col.label}</span>
                    <span className="rounded-full bg-background px-2 text-xs text-foreground-muted">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map((it) => <ContentCard key={it.id} item={it} psyId={id} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

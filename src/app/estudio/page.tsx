import Link from "next/link";
import { Users, Loader, Clock, CheckCircle2, ArrowRight, MessageCircle, AlertTriangle } from "lucide-react";
import { listStudioClients, studioStats, currentCycle, cycleLabel, PECAS_POR_CICLO } from "@/lib/studio";
import { AvatarBubble } from "@/components/ui/avatar-bubble";

const TONES: Record<string, string> = {
  neutral: "bg-surface-muted text-foreground-muted",
  brand: "bg-brand/10 text-brand-dark",
  warning: "bg-yellow-400/20 text-yellow-700",
  success: "bg-brand/15 text-green-700",
};

function Stat({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone?: "neutral" | "brand" | "warning" | "success";
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-heading">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
    </div>
  );
}

export default async function EstudioHome() {
  const cycle = currentCycle();
  const [stats, clients] = await Promise.all([studioStats(cycle), listStudioClients(cycle)]);

  // Quem precisa de atenção primeiro: mensagem sem ler, atraso, depois o resto.
  const ordenados = [...clients].sort(
    (a, b) =>
      b.naoLidas - a.naoLidas ||
      b.atrasadas - a.atrasadas ||
      (a.display_name ?? "").localeCompare(b.display_name ?? "")
  );
  const precisamDeVoce = clients.filter((c) => c.naoLidas > 0 || c.atrasadas > 0).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl">Estúdio de conteúdo</h1>
        <p className="mt-1 text-foreground-muted">
          Ciclo atual: <strong className="text-heading">{cycleLabel(cycle)}</strong> · {PECAS_POR_CICLO} peças por cliente Presença.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Clientes Presença" value={stats.clientes} tone="brand" />
        <Stat icon={Loader} label="Em produção" value={stats.emProducao} tone="neutral" />
        <Stat icon={Clock} label="Em revisão/ajustes" value={stats.emRevisao} tone={stats.emRevisao > 0 ? "warning" : "neutral"} />
        <Stat icon={CheckCircle2} label="Entregues no mês" value={stats.entregues} tone="success" />
      </div>

      <section className="rounded-2xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-4">
          <h2 className="text-lg">Clientes ({clients.length})</h2>
          {precisamDeVoce > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand-dark">
              {precisamDeVoce} precisam de você — estão no topo
            </span>
          )}
        </div>
        {clients.length === 0 ? (
          <div className="px-6 py-12 text-center text-foreground-muted">
            Nenhum psicólogo no plano Presença ainda. Assim que alguém assinar, aparece aqui.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {ordenados.map((c) => {
              const pct = c.total > 0 ? Math.round((c.entregues / c.total) * 100) : 0;
              return (
                <li key={c.id}>
                  <Link href={`/estudio/psicologo/${c.id}`} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-muted/50">
                    <AvatarBubble src={c.avatar_url} name={c.display_name} seed={c.id} size={90} className="w-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-heading">{c.display_name || "—"}</p>
                      <p className="text-xs text-foreground-muted">{c.city || "—"}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {c.naoLidas > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-brand/15 px-1.5 py-0.5 text-[11px] font-semibold text-brand-dark">
                            <MessageCircle className="h-3 w-3" /> {c.naoLidas} sem ler
                          </span>
                        )}
                        {c.atrasadas > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                            <AlertTriangle className="h-3 w-3" /> {c.atrasadas} atrasada(s)
                          </span>
                        )}
                        {c.comOPsicologo > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
                            <Clock className="h-3 w-3" /> {c.comOPsicologo} esperando resposta dele
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden w-40 sm:block">
                      <div className="mb-1 flex justify-between text-xs text-foreground-muted">
                        <span>{c.entregues}/{c.total || PECAS_POR_CICLO} entregues</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

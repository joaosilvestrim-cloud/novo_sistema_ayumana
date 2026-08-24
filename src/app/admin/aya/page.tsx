import Link from "next/link";
import { MessageSquare, Sparkles, LifeBuoy, TrendingUp } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Assistente Aya" };

type Log = {
  id: string; question: string | null; reply: string | null;
  escalated: boolean; logged_in: boolean; created_at: string;
};

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800">{icon}</div>
      <p className="mt-3 text-2xl font-semibold text-heading">{value}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
    </div>
  );
}

export default async function AdminAyaPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const now = Date.now();
  const iso7 = new Date(now - 7 * 86_400_000).toISOString();
  const iso30 = new Date(now - 30 * 86_400_000).toISOString();

  const [totalC, d7C, recentesR, suporteR] = await Promise.all([
    admin.from("assistant_log").select("*", { count: "exact", head: true }),
    admin.from("assistant_log").select("*", { count: "exact", head: true }).gte("created_at", iso7),
    admin.from("assistant_log").select("id, question, reply, escalated, logged_in, created_at").order("created_at", { ascending: false }).limit(400),
    // Pedidos de atendimento humano: TODOS os canais (Aya e botão de ajuda do
    // painel) passam por sendSupportRequest, que grava kind='suporte'.
    admin.from("notifications").select("id, subject, preview, body, status, profile_id, created_at").eq("kind", "suporte").order("created_at", { ascending: false }).limit(200),
  ]);

  const total = totalC.count ?? 0;
  const em7 = d7C.count ?? 0;
  const recentes = (recentesR.data as Log[]) ?? [];

  // Cada pedido gera uma notificação por destinatário (joao + luiz). Deduplica
  // pelo horário, que é idêntico no par.
  type Suporte = { id: string; subject: string | null; preview: string | null; body: string | null; status: string | null; profile_id: string | null; created_at: string };
  const suporteRows = (suporteR.data as Suporte[]) ?? [];
  const vistos = new Set<string>();
  const pedidos: Suporte[] = [];
  for (const n of suporteRows) {
    if (vistos.has(n.created_at)) continue;
    vistos.add(n.created_at);
    pedidos.push(n);
  }
  const escaladasTotal = pedidos.length;

  // Perguntas mais frequentes (agrupa por texto normalizado).
  const freq = new Map<string, { texto: string; n: number }>();
  for (const r of recentes) {
    const q = (r.question ?? "").trim();
    if (!q) continue;
    const chave = q.toLowerCase();
    const atual = freq.get(chave);
    if (atual) atual.n++;
    else freq.set(chave, { texto: q, n: 1 });
  }
  const topPerguntas = [...freq.values()].sort((a, b) => b.n - a.n).slice(0, 8);

  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl"><Sparkles className="h-6 w-6 text-brand-dark" /> Assistente Aya</h1>
        <p className="mt-1 text-foreground-muted">O que a base pergunta, quanto a Aya conversa e quem pediu atendimento humano.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<MessageSquare className="h-5 w-5" />} label="Interações no total" value={total} />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Nos últimos 7 dias" value={em7} />
        <Stat icon={<LifeBuoy className="h-5 w-5" />} label="Pedidos de atendimento humano" value={escaladasTotal} />
        <Stat icon={<Sparkles className="h-5 w-5" />} label="Perguntas diferentes (amostra)" value={freq.size} />
      </div>

      {/* Solicitações de atendimento humano */}
      <section className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg"><LifeBuoy className="h-5 w-5 text-brand-dark" /> Pedidos de atendimento humano</h2>
          <p className="mt-0.5 text-sm text-foreground-muted">Todos os canais: a Aya e o botão de ajuda do painel. Também chega por e-mail; aqui fica o histórico.</p>
        </div>
        {pedidos.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-muted">Ninguém pediu atendimento humano ainda.</div>
        ) : (
          <ul className="divide-y divide-border">
            {pedidos.map((s) => {
              const nome = (s.subject || "").replace(/^Pedido de ajuda na Ayumana[:\s—-]*/i, "").trim() || "Pedido de ajuda";
              const detalhe = s.body || s.preview || "";
              return (
                <li key={s.id} className="px-6 py-3">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-heading group-open:text-brand-dark">{nome}</span>
                        {s.preview && <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted group-open:hidden">{s.preview}</p>}
                        <span className="mt-0.5 hidden text-xs text-brand-dark group-open:inline">ver menos</span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-foreground-muted">{fmt(s.created_at)}</span>
                        <Badge tone={s.status === "enviado" ? "success" : "warning"}>{s.status || "—"}</Badge>
                      </div>
                    </summary>
                    <div className="mt-3 rounded-xl border border-border bg-surface-muted/50 p-4">
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">{detalhe || "Sem detalhe registrado para este pedido."}</p>
                      {s.profile_id && (
                        <Link href={`/admin/usuarios/${s.profile_id}`} className="mt-3 inline-block text-xs font-medium text-brand-dark hover:underline">
                          Abrir cadastro do psicólogo →
                        </Link>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Perguntas mais frequentes */}
      <section className="rounded-2xl border border-border bg-background p-6">
        <h2 className="text-lg">Perguntas mais frequentes</h2>
        <p className="mt-0.5 text-sm text-foreground-muted">Amostra das últimas 400 interações. Bom para ver o que ensinar à Aya ou melhorar no site.</p>
        {topPerguntas.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">Ainda não há perguntas registradas.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {topPerguntas.map((p) => (
              <div key={p.texto} className="flex items-center gap-3">
                <div className="min-w-0 flex-1 truncate text-sm text-foreground">{p.texto}</div>
                <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{p.n}×</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Últimas perguntas */}
      <section className="rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg">Últimas perguntas</h2>
        </div>
        {recentes.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-muted">Nenhuma interação ainda.</div>
        ) : (
          <ul className="divide-y divide-border">
            {recentes.slice(0, 40).map((r) => (
              <li key={r.id} className="px-6 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-heading">{r.question || "—"}</p>
                    {r.reply && <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">{r.reply}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-foreground-muted">{fmt(r.created_at)}</span>
                    {r.escalated && <Badge tone="warning">escalou</Badge>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

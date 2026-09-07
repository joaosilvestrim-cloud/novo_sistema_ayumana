import Link from "next/link";
import { Sparkles } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { setWaitlistStatusAction } from "./actions";
import { PresencaCharge } from "@/components/admin/presenca-charge";
import { isAsaasConfigured, getSubscriptionPayment } from "@/lib/payments/asaas";

export const metadata = { title: "Fila Presença" };

type Row = {
  id: string; psychologist_id: string | null;
  name: string | null; email: string | null; phone: string | null;
  city: string | null; crp: string | null; note: string | null;
  status: string; created_at: string; checkout_url: string | null;
  asaas_subscription_id: string | null; charge_created_by: string | null; charge_created_at: string | null;
};

function statusPagamento(st: string | null | undefined): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  if (!st) return { label: "sem cobrança emitida", tone: "neutral" };
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(st)) return { label: "Pago", tone: "success" };
  if (st === "OVERDUE") return { label: "Vencido", tone: "danger" };
  if (["PENDING", "AWAITING_RISK_ANALYSIS", "AWAITING_CHARGEBACK_REVERSAL"].includes(st)) return { label: "Aguardando pagamento", tone: "warning" };
  if (["REFUNDED", "REFUND_REQUESTED", "CHARGEBACK_REQUESTED"].includes(st)) return { label: "Estornado", tone: "neutral" };
  return { label: st, tone: "neutral" };
}

const STATUS = ["novo", "contatado", "cobranca_gerada", "recusado"] as const;
const STATUS_LABEL: Record<string, string> = {
  novo: "Novo", contatado: "Contatado", cobranca_gerada: "Cobrança gerada", recusado: "Recusado",
};
const TONE: Record<string, "warning" | "brand" | "success" | "neutral"> = {
  novo: "warning", contatado: "brand", cobranca_gerada: "success", recusado: "neutral",
};

// Normaliza o status para o pipeline atual. Cobre valores antigos ("pendente",
// "aprovado") e nunca mostra "Novo" quando a cobrança já foi gerada.
function normalizeStatus(raw: string, temCobranca: boolean): string {
  let s = raw;
  if (s === "aprovado") s = "cobranca_gerada";
  else if (s === "pendente") s = "novo";
  if (!(STATUS as readonly string[]).includes(s)) s = "novo";
  if (temCobranca && s === "novo") s = "cobranca_gerada";
  return s;
}

export default async function AdminPresencaPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("presenca_waitlist")
    .select("id, psychologist_id, name, email, phone, city, crp, note, status, created_at, checkout_url, asaas_subscription_id, charge_created_by, charge_created_at")
    .order("created_at", { ascending: false });
  const rows = (data as Row[]) ?? [];

  // Liga cada inscrito ao perfil no admin (quando já é psicólogo cadastrado).
  const psyIds = rows.map((r) => r.psychologist_id).filter(Boolean) as string[];
  const perfilPorPsy = new Map<string, string>();
  if (psyIds.length) {
    const { data: psys } = await admin.from("psychologists").select("id, profile_id").in("id", psyIds);
    for (const p of (psys ?? []) as { id: string; profile_id: string }[]) perfilPorPsy.set(p.id, p.profile_id);
  }

  // Nome de quem gerou cada cobrança.
  const adminIds = [...new Set(rows.map((r) => r.charge_created_by).filter(Boolean) as string[])];
  const nomePorAdmin = new Map<string, string>();
  if (adminIds.length) {
    const { data: profs } = await admin.from("profiles").select("id, full_name").in("id", adminIds);
    for (const p of (profs ?? []) as { id: string; full_name: string | null }[]) nomePorAdmin.set(p.id, p.full_name || "Equipe");
  }

  // Situação do pagamento ao vivo no Asaas (só para quem já tem assinatura criada).
  const pagamentoPorSub = new Map<string, { status: string | null; paymentDate: string | null; dueDate: string | null }>();
  if (isAsaasConfigured()) {
    const subs = [...new Set(rows.map((r) => r.asaas_subscription_id).filter(Boolean) as string[])];
    const pagos = await Promise.all(
      subs.map(async (sub) => ({ sub, pg: await getSubscriptionPayment(sub) }))
    );
    for (const { sub, pg } of pagos) {
      if (pg) pagamentoPorSub.set(sub, { status: pg.status, paymentDate: pg.paymentDate, dueDate: pg.dueDate });
    }
  }

  const pendentes = rows.filter((r) => normalizeStatus(r.status, !!(r.asaas_subscription_id || r.checkout_url)) === "novo").length;
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const wa = (t: string | null) => (t ? `https://wa.me/${t.replace(/\D/g, "")}` : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-2xl"><Sparkles className="h-6 w-6 text-brand-dark" /> Fila do Presença</h1>
          <p className="mt-1 text-foreground-muted">Quem se inscreveu para o plano Presença (vagas limitadas). Chame conforme abre vaga.</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-sm font-medium text-yellow-700">{pendentes} novo(s)</span>
          <span className="rounded-full bg-surface-muted px-3 py-1 text-sm font-medium text-foreground">{rows.length} no total</span>
        </div>
      </div>

      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4">
        <p className="text-sm font-semibold text-heading">Como funciona o fluxo do Presença</p>
        <ol className="mt-2 flex flex-col gap-2 text-sm text-foreground sm:flex-row sm:items-stretch sm:gap-0">
          {[
            { n: "1", t: "Inscreveu", d: "A pessoa entrou na fila em /para-psicologos." },
            { n: "2", t: "Gerar cobrança", d: "Você clica em “Gerar cobrança e link” e envia o link (WhatsApp)." },
            { n: "3", t: "Pagou", d: "O status vira “Pago” aqui automaticamente pelo Asaas." },
            { n: "4", t: "Entra no Kanban", d: "Só quando estiver Pago, mova a pessoa para o quadro do Presença." },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex flex-1 items-start gap-2 sm:px-3">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.n === "4" ? "bg-green-600 text-white" : "bg-brand text-white"}`}>{s.n}</span>
              <div className="min-w-0">
                <p className="font-medium leading-tight text-heading">{s.t}</p>
                <p className="text-xs leading-tight text-foreground-muted">{s.d}</p>
              </div>
              {i < arr.length - 1 && <span className="hidden self-center text-foreground-muted sm:block">→</span>}
            </div>
          ))}
        </ol>
        <p className="mt-3 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-700">
          Regra clara: a pessoa só vai para o Kanban do Presença depois que o pagamento aparecer como <span className="font-bold">Pago</span> nesta tela. Antes disso ela continua só na fila.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-background px-6 py-12 text-center text-foreground-muted">
          Ninguém na fila ainda. As inscrições feitas em /para-psicologos aparecem aqui.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const perfil = r.psychologist_id ? perfilPorPsy.get(r.psychologist_id) : null;
            const w = wa(r.phone);
            const pg = r.asaas_subscription_id ? pagamentoPorSub.get(r.asaas_subscription_id) : null;
            const sp = statusPagamento(pg?.status ?? (r.asaas_subscription_id ? "PENDING" : null));
            const spClass =
              sp.tone === "success" ? "bg-green-500/15 text-green-700"
              : sp.tone === "danger" ? "bg-danger/15 text-danger"
              : sp.tone === "warning" ? "bg-yellow-400/15 text-yellow-700"
              : "bg-surface-muted text-foreground-muted";
            const geradaPor = r.charge_created_by ? nomePorAdmin.get(r.charge_created_by) : null;
            const st = normalizeStatus(r.status, !!(r.asaas_subscription_id || r.checkout_url));
            const pago = sp.tone === "success";
            return (
              <li key={r.id} className={`rounded-2xl border bg-background p-5 ${pago ? "border-green-500/50 ring-1 ring-green-500/30" : "border-border"}`}>
                {pago && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">
                    Pagou → pode mover para o Kanban do Presença agora.
                  </div>
                )}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-heading">{r.name || "—"}</span>
                      <Badge tone={TONE[st] ?? "neutral"}>{STATUS_LABEL[st] ?? st}</Badge>
                      {!r.psychologist_id && <Badge tone="neutral">sem conta</Badge>}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-muted">
                      {r.email && <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>}
                      {r.phone && (w ? <a href={w} target="_blank" className="text-brand-dark hover:underline">{r.phone}</a> : <span>{r.phone}</span>)}
                      {r.city && <span>{r.city}</span>}
                      {r.crp && <span>CRP {r.crp}</span>}
                      <span>inscreveu em {fmt(r.created_at)}</span>
                    </div>
                    {r.note && <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground">{r.note}</p>}

                    {r.asaas_subscription_id && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted/60 px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${spClass}`}>
                          {sp.label}
                        </span>
                        {sp.tone === "success" && pg?.paymentDate && (
                          <span className="text-xs text-foreground-muted">pago em {fmt(pg.paymentDate)}</span>
                        )}
                        {sp.tone !== "success" && pg?.dueDate && (
                          <span className="text-xs text-foreground-muted">vence em {new Date(pg.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                        )}
                        <span className="text-xs text-foreground-muted">
                          · Cobrança gerada por <span className="font-medium text-foreground">{geradaPor ?? "Equipe"}</span>
                          {r.charge_created_at && <> em {fmt(r.charge_created_at)}</>}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <form action={setWaitlistStatusAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={st} className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
                        {STATUS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                      <button className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover">Salvar</button>
                    </form>
                    <span className="text-[11px] text-foreground-muted">Etapa manual. “Pago” é automático pelo Asaas.</span>
                    <PresencaCharge id={r.id} checkoutUrl={r.checkout_url} phone={r.phone} name={r.name} />
                    {perfil && (
                      <Link href={`/admin/usuarios/${perfil}`} className="text-xs font-medium text-brand-dark hover:underline">Ver no admin →</Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

import { Ticket, CheckCircle2, AlertCircle, Power, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { COUPON_DURATION_LABEL, type CouponDuration } from "@/lib/pricing";
import { createCouponAction, toggleCouponAction, deleteCouponAction } from "./actions";

export const metadata = { title: "Cupons" };

type Row = {
  code: string;
  percent: number;
  duration: CouponDuration;
  description: string | null;
  active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  created_at: string;
};

const input = "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand";
const label = "mb-1 block text-xs font-medium text-heading";

export default async function CuponsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").order("created_at", { ascending: false });
  const rows = (data as Row[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Cupons</h1>
        <p className="mt-1 text-foreground-muted">
          Códigos de desconto que o cliente digita no checkout. O desconto vale para os planos pagos, mensal ou anual.
        </p>
      </div>

      {sp.ok && (
        <p className="flex items-center gap-2 rounded-xl border border-green-600/40 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {sp.ok}
        </p>
      )}
      {sp.erro && (
        <p className="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" /> {sp.erro}
        </p>
      )}

      {/* Novo cupom */}
      <form action={createCouponAction} className="rounded-2xl border border-border bg-background p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg"><Ticket className="h-5 w-5 text-brand-dark" /> Novo cupom</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={label} htmlFor="code">Código</label>
            <input id="code" name="code" required placeholder="BEMVINDO50" className={`${input} uppercase`} />
          </div>
          <div>
            <label className={label} htmlFor="percent">Desconto (%)</label>
            <input id="percent" name="percent" type="number" min="1" max="100" defaultValue="50" required className={input} />
          </div>
          <div>
            <label className={label} htmlFor="duration">Duração do desconto</label>
            <select id="duration" name="duration" defaultValue="first_year" className={input}>
              <option value="first_year">Primeiro ano</option>
              <option value="first_payment">Só a primeira cobrança</option>
              <option value="forever">Enquanto a assinatura durar</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="max_uses">Limite de usos <span className="font-normal text-foreground-muted">(opcional)</span></label>
            <input id="max_uses" name="max_uses" type="number" min="1" placeholder="Ilimitado" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="expires_at">Válido até <span className="font-normal text-foreground-muted">(opcional)</span></label>
            <input id="expires_at" name="expires_at" type="date" className={input} />
          </div>
          <div>
            <label className={label} htmlFor="description">Observação <span className="font-normal text-foreground-muted">(interna)</span></label>
            <input id="description" name="description" placeholder="Ex.: parceria com o CRP-06" className={input} />
          </div>
        </div>
        <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          <Ticket className="h-4 w-4" /> Criar cupom
        </button>
      </form>

      {/* Lista */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-muted">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
              <th className="px-4 py-3 font-medium">Duração</th>
              <th className="px-4 py-3 font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.code} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <span className="font-mono font-semibold text-heading">{c.code}</span>
                  {c.description && <p className="text-xs text-foreground-muted">{c.description}</p>}
                </td>
                <td className="px-4 py-3 font-semibold text-brand-dark">{c.percent}%</td>
                <td className="px-4 py-3 text-foreground-muted">{COUPON_DURATION_LABEL[c.duration]}</td>
                <td className="px-4 py-3 text-foreground-muted">
                  {c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ""}
                </td>
                <td className="px-4 py-3 text-foreground-muted">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3">
                  {c.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="neutral">Inativo</Badge>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="code" value={c.code} />
                      <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                      <button className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs hover:bg-surface-muted" title={c.active ? "Desativar" : "Ativar"}>
                        <Power className="h-3.5 w-3.5" /> {c.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                    <form action={deleteCouponAction}>
                      <input type="hidden" name="code" value={c.code} />
                      <ConfirmButton
                        message={`Excluir o cupom ${c.code}? Quem já usou mantém o desconto.`}
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-danger/40 px-2.5 text-xs text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">Nenhum cupom ainda. Crie o primeiro acima.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

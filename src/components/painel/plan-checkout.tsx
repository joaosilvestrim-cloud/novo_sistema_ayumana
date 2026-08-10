"use client";

import { useState, useTransition } from "react";
import { Check, Tag, X, Sparkles } from "lucide-react";
import {
  chargeCents, periodBaseCents, formatCents, annualSavings,
  COUPON_DURATION_LABEL, type BillingPeriod, type CouponDuration,
} from "@/lib/pricing";
import { selectPlanAction, previewCouponAction } from "@/app/painel/assinatura/actions";

type PlanRow = {
  id: string;
  name: string;
  price_cents: number;
  features: string[];
  is_selfservice: boolean;
};

type CouponState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; percent: number; duration: CouponDuration }
  | { status: "erro"; reason: string };

export function PlanCheckout({
  plans,
  current,
  needsCpf,
}: {
  plans: PlanRow[];
  current: string;
  needsCpf: boolean;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponState>({ status: "idle" });
  const [checking, startCheck] = useTransition();

  const couponPct = coupon.status === "ok" ? coupon.percent : null;

  const aplicarCupom = () => {
    const code = couponInput.trim();
    if (!code) return;
    setCoupon({ status: "checking" });
    startCheck(async () => {
      try {
        const r = await previewCouponAction(code);
        if (r.ok) setCoupon({ status: "ok", percent: r.percent!, duration: (r.duration as CouponDuration) ?? "first_year" });
        else setCoupon({ status: "erro", reason: r.reason ?? "Cupom inválido." });
      } catch {
        setCoupon({ status: "erro", reason: "Não deu para validar o cupom agora. Tente de novo." });
      }
    });
  };

  const limparCupom = () => {
    setCoupon({ status: "idle" });
    setCouponInput("");
  };

  const paid = plans.filter((p) => p.is_selfservice && p.id !== "essencial");
  const anual = period === "yearly";

  return (
    <div className="space-y-5">
      {/* Período + cupom */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4">
        {/* Alternador mensal / anual */}
        <div className="inline-flex rounded-xl border border-border bg-surface-muted p-1">
          <button
            onClick={() => setPeriod("monthly")}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${!anual ? "bg-background text-heading shadow-sm" : "text-foreground-muted"}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setPeriod("yearly")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${anual ? "bg-background text-heading shadow-sm" : "text-foreground-muted"}`}
          >
            Anual
            <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">-25%</span>
          </button>
        </div>

        {/* Cupom */}
        <div className="flex items-center gap-2">
          {coupon.status === "ok" ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">
              <Tag className="h-3.5 w-3.5" /> {coupon.percent}% OFF
              <button onClick={limparCupom} className="ml-1 text-green-700 hover:text-green-900"><X className="h-3.5 w-3.5" /></button>
            </span>
          ) : (
            <>
              <input
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (coupon.status === "erro") setCoupon({ status: "idle" }); }}
                onKeyDown={(e) => e.key === "Enter" && aplicarCupom()}
                placeholder="Cupom"
                className="h-9 w-32 rounded-lg border border-border bg-background px-3 text-sm uppercase outline-none focus:border-brand"
              />
              <button
                onClick={aplicarCupom}
                disabled={checking}
                className="h-9 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-muted disabled:opacity-60"
              >
                {checking ? "..." : "Aplicar"}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="-mt-2 text-xs text-foreground-muted">
        {anual
          ? "No plano anual a cobrança é uma vez por ano, com 25% de desconto. Sem fidelidade, cancela quando quiser."
          : "Cobrança todo mês. Sem fidelidade, cancela quando quiser."}
      </p>

      {coupon.status === "erro" && (
        <p className="-mt-2 text-sm text-danger">{coupon.reason}</p>
      )}
      {coupon.status === "ok" && (
        <p className="-mt-2 text-sm text-green-700">
          Cupom aplicado. Desconto de {coupon.percent}% · {COUPON_DURATION_LABEL[coupon.duration].toLowerCase()}.
        </p>
      )}

      {/* Cards dos planos pagos */}
      <div className="grid gap-4 md:grid-cols-2">
        {paid.map((plan) => {
          const active = plan.id === current;
          const base = periodBaseCents(plan.price_cents, period);
          const final = chargeCents(plan.price_cents, period, couponPct);
          const temCupom = couponPct != null && final < base;
          const sav = annualSavings(plan.price_cents);

          return (
            <div key={plan.id} className={`rounded-2xl border p-6 ${active ? "border-brand ring-2 ring-brand/20" : "border-border"} bg-background`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg">{plan.name}</h2>
                {plan.id === "ideal" && <span className="rounded-full bg-[#F5C84B]/25 px-2 py-0.5 text-[11px] font-bold text-[#8A6D00]">Popular</span>}
              </div>

              {/* Preço */}
              <div className="mt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold text-brand-dark">{formatCents(final)}</span>
                  <span className="text-sm text-foreground-muted">/{anual ? "ano" : "mês"}</span>
                  {temCupom && <span className="text-sm text-foreground-muted line-through">{formatCents(base)}</span>}
                </div>
                {anual && (
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Economia de {formatCents(sav.cents)} no ano ({sav.pct}% off)
                  </p>
                )}
                {temCupom && coupon.status === "ok" && coupon.duration !== "forever" && (
                  <p className="mt-0.5 text-xs text-green-700">
                    {coupon.duration === "first_year"
                      ? `Preço do 1º ano. Depois ${formatCents(base)}/${anual ? "ano" : "mês"}.`
                      : `Só na 1ª cobrança. Depois ${formatCents(base)}/${anual ? "ano" : "mês"}.`}
                  </p>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {f}
                  </li>
                ))}
              </ul>

              {active ? (
                <button disabled className="mt-5 h-10 w-full rounded-lg border border-border text-sm text-foreground-muted">
                  Plano atual
                </button>
              ) : (
                <form action={selectPlanAction} className="mt-5">
                  <input type="hidden" name="plan" value={plan.id} />
                  <input type="hidden" name="period" value={period} />
                  <input type="hidden" name="coupon" value={coupon.status === "ok" ? couponInput.trim() : ""} />
                  {needsCpf && (
                    <div className="mb-3">
                      <label htmlFor={`cpf-${plan.id}`} className="mb-1 block text-xs font-medium text-heading">CPF ou CNPJ</label>
                      <input
                        id={`cpf-${plan.id}`}
                        name="cpf_cnpj"
                        inputMode="numeric"
                        required
                        placeholder="Somente números"
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                      />
                      <p className="mt-1 text-[11px] text-foreground-muted">
                        Exigido pelo Asaas para emitir a cobrança. Enviamos direto ao provedor e não guardamos no nosso banco.
                      </p>
                    </div>
                  )}
                  <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                    <Sparkles className="h-4 w-4" /> Assinar {plan.name} · {formatCents(final)}
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

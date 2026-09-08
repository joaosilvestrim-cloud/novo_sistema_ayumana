// Cálculo de preços: mensal, anual (com desconto) e cupom.
// Puro, sem dependência de servidor, para usar no checkout e no admin.

export type BillingPeriod = "monthly" | "yearly";
export type CouponDuration = "first_payment" | "first_year" | "forever";

/**
 * Converte um valor digitado em reais para centavos.
 *
 * Aceita a digitação simples ("500"), decimal brasileira ("500,00"),
 * decimal com ponto ("500.00") e valores com milhar ("1.500,50" ou
 * "1,500.50"). O último separador só é decimal quando há 1 ou 2 algarismos
 * depois dele; com 3, é tratado como separador de milhar.
 */
export function parseBrlToCents(value: string): number | null {
  const cleaned = value.trim().replace(/[^\d.,-]/g, "");
  if (!cleaned || !/\d/.test(cleaned)) return null;

  const negative = cleaned.startsWith("-");
  const unsigned = cleaned.replace(/-/g, "");
  const lastComma = unsigned.lastIndexOf(",");
  const lastDot = unsigned.lastIndexOf(".");
  const lastSeparator = Math.max(lastComma, lastDot);

  let integerDigits: string;
  let fractionDigits = "";
  if (lastSeparator >= 0) {
    const trailing = unsigned.slice(lastSeparator + 1).replace(/\D/g, "");
    const isDecimal = trailing.length === 1 || trailing.length === 2;
    if (isDecimal) {
      integerDigits = unsigned.slice(0, lastSeparator).replace(/\D/g, "");
      fractionDigits = trailing.padEnd(2, "0");
    } else {
      integerDigits = unsigned.replace(/\D/g, "");
    }
  } else {
    integerDigits = unsigned.replace(/\D/g, "");
  }

  const reais = Number(integerDigits || "0");
  const centavos = Number(fractionDigits || "0");
  if (!Number.isSafeInteger(reais) || !Number.isSafeInteger(centavos)) return null;
  const total = reais * 100 + centavos;
  return negative ? -total : total;
}

/** Valor para campo editável, sem obrigar o sufixo ",00". */
export function formatBrlInput(cents: number | null | undefined): string {
  if (!cents) return "";
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Desconto do plano anual sobre o total de 12 meses. */
export const ANNUAL_DISCOUNT_PCT = 25;

/** Total de 12 meses sem desconto. */
export function yearlyFullCents(monthlyCents: number): number {
  return monthlyCents * 12;
}

/** Preço do ano já com o desconto anual. */
export function yearlyCents(monthlyCents: number): number {
  return Math.round(yearlyFullCents(monthlyCents) * (1 - ANNUAL_DISCOUNT_PCT / 100));
}

/** Preço do período escolhido, antes de qualquer cupom. */
export function periodBaseCents(monthlyCents: number, period: BillingPeriod): number {
  return period === "yearly" ? yearlyCents(monthlyCents) : monthlyCents;
}

/** Aplica o cupom (percentual) sobre um valor em centavos. */
export function applyCoupon(cents: number, percent: number | null | undefined): number {
  if (!percent || percent <= 0) return cents;
  const p = Math.min(100, Math.max(0, percent));
  return Math.round(cents * (1 - p / 100));
}

/**
 * Valor que será cobrado agora, considerando período e cupom.
 * O cupom incide sobre o preço do período (mensal ou anual já com desconto).
 */
export function chargeCents(
  monthlyCents: number,
  period: BillingPeriod,
  couponPercent?: number | null
): number {
  return applyCoupon(periodBaseCents(monthlyCents, period), couponPercent);
}

/** Ciclo do Asaas conforme o período. */
export function asaasCycle(period: BillingPeriod): "MONTHLY" | "YEARLY" {
  return period === "yearly" ? "YEARLY" : "MONTHLY";
}

/** Quando o desconto do cupom deixa de valer. Null = para sempre. */
export function couponEndsAt(duration: CouponDuration, period: BillingPeriod): Date | null {
  if (duration === "forever") return null;
  const d = new Date();
  if (duration === "first_payment") {
    // Uma cobrança: mensal = 1 mês, anual = 1 ano.
    if (period === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
  } else {
    // first_year: 12 meses de desconto.
    d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}

/** R$ 24,90 a partir de centavos. */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** Economia do anual em centavos e em porcentagem. */
export function annualSavings(monthlyCents: number): { cents: number; pct: number } {
  const full = yearlyFullCents(monthlyCents);
  const withDisc = yearlyCents(monthlyCents);
  return { cents: full - withDisc, pct: ANNUAL_DISCOUNT_PCT };
}

/** Rótulo curto do período. */
export const PERIOD_LABEL: Record<BillingPeriod, string> = {
  monthly: "Mensal",
  yearly: "Anual",
};

export const COUPON_DURATION_LABEL: Record<CouponDuration, string> = {
  first_payment: "Só a primeira cobrança",
  first_year: "Primeiro ano",
  forever: "Enquanto a assinatura durar",
};

import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CouponDuration } from "@/lib/pricing";

export type Coupon = {
  code: string;
  percent: number;
  duration: CouponDuration;
  description: string | null;
  active: boolean;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
};

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Busca um cupom pelo código, sem validar prazo/limite. */
export async function getCoupon(rawCode: string): Promise<Coupon | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("*").eq("code", normalizeCode(rawCode)).maybeSingle();
  return (data as Coupon | null) ?? null;
}

export type CouponCheck =
  | { ok: true; coupon: Coupon }
  | { ok: false; reason: string };

/** Confere se o cupom existe, está ativo, no prazo e com usos disponíveis. */
export async function validateCoupon(rawCode: string): Promise<CouponCheck> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "Informe o código do cupom." };

  const admin = createAdminClient();
  const { data, error } = await admin.from("coupons").select("*").eq("code", code).maybeSingle();
  if (error) return { ok: false, reason: "Não foi possível validar o cupom agora." };
  const coupon = data as Coupon | null;

  if (!coupon) return { ok: false, reason: "Cupom não encontrado." };
  if (!coupon.active) return { ok: false, reason: "Este cupom não está mais ativo." };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "Este cupom expirou." };
  }
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return { ok: false, reason: "Este cupom atingiu o limite de usos." };
  }
  return { ok: true, coupon };
}

/** Soma 1 ao contador de usos do cupom. */
export async function incrementCouponUse(code: string): Promise<void> {
  const admin = createAdminClient();
  const c = normalizeCode(code);
  const { data } = await admin.from("coupons").select("used_count").eq("code", c).maybeSingle();
  const atual = (data?.used_count as number) ?? 0;
  await admin.from("coupons").update({ used_count: atual + 1 }).eq("code", c);
}

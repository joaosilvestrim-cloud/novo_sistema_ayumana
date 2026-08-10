"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeCode } from "@/lib/coupons";

const DURATIONS = ["first_payment", "first_year", "forever"] as const;

function volta(msg: string, tipo: "ok" | "erro" = "erro"): never {
  redirect(`/admin/cupons?${tipo}=${encodeURIComponent(msg)}`);
}

export async function createCouponAction(formData: FormData) {
  const me = await requireAdmin();
  const code = normalizeCode(String(formData.get("code") ?? ""));
  const percent = Math.round(Number(formData.get("percent") ?? 0));
  const duration = String(formData.get("duration") ?? "first_year");
  const description = String(formData.get("description") ?? "").trim() || null;
  const maxUsesRaw = String(formData.get("max_uses") ?? "").trim();
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();

  if (!/^[A-Z0-9]{3,20}$/.test(code)) volta("O código deve ter 3 a 20 letras ou números, sem espaço.");
  if (!(percent >= 1 && percent <= 100)) volta("O desconto deve ser entre 1 e 100.");
  if (!DURATIONS.includes(duration as (typeof DURATIONS)[number])) volta("Duração inválida.");

  const admin = createAdminClient();
  const { data: existe } = await admin.from("coupons").select("code").eq("code", code).maybeSingle();
  if (existe) volta(`Já existe um cupom com o código ${code}.`);

  const { error } = await admin.from("coupons").insert({
    code,
    percent,
    duration,
    description,
    max_uses: maxUsesRaw ? Math.max(1, Number(maxUsesRaw)) : null,
    expires_at: expiresRaw ? new Date(`${expiresRaw}T23:59:59`).toISOString() : null,
    created_by: me.id,
  });
  if (error) volta(`Não deu para criar: ${error.message}`);

  revalidatePath("/admin/cupons");
  volta(`Cupom ${code} criado.`, "ok");
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!code) return;
  const admin = createAdminClient();
  await admin.from("coupons").update({ active }).eq("code", code);
  revalidatePath("/admin/cupons");
}

export async function deleteCouponAction(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") ?? "");
  if (!code) return;
  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("code", code);
  revalidatePath("/admin/cupons");
}

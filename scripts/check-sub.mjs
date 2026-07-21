import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const r = await s.from("psychologists")
  .select("display_name,plan_tier,subscription_status,subscription_period_end,asaas_customer_id,asaas_subscription_id,is_published")
  .eq("id","79cf0dde-e8f9-4fb3-831d-6e8b8406c4a4").maybeSingle();
if (r.error) { console.log("ERRO:", r.error.message); process.exit(1); }
console.log(JSON.stringify(r.data, null, 2));
const ev = await s.from("payment_events").select("id,event", { count: "exact" }).order("id", { ascending: false }).limit(5);
console.log("\nultimos eventos de webhook:", ev.count ?? 0);
(ev.data ?? []).forEach(e => console.log(`  · ${e.event} — ${e.id}`));

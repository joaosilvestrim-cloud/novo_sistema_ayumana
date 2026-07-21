import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const r = await s.from("psychologists").select("id,display_name,headline,bio").not("headline","is",null);
if (r.error) { console.log("ERRO", r.error.message); process.exit(1); }
const rows = r.data ?? [];
const cortadas = rows.filter(y => {
  const h = (y.headline||"").trim();
  if (!h) return false;
  return h.length >= 138 && !/[.!?…]$/.test(h); // cortada no limite, sem pontuação final
});
console.log(`headlines totais: ${rows.length}`);
console.log(`headlines truncadas (>=138ch e sem pontuação final): ${cortadas.length}`);
cortadas.slice(0,6).forEach(y=>console.log(`  · ${y.display_name}: "...${(y.headline||"").slice(-40)}"`));

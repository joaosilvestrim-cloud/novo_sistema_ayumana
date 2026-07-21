import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// 0) tabela existe?
const chk = await s.from("content_items").select("id", { count: "exact", head: true });
if (chk.error) { console.error("content_items indisponível:", chk.error.message); process.exit(1); }
console.log("✓ tabela content_items ok");

// 1) acha a Dra. Ana demo
const { data: ana } = await s.from("psychologists").select("id, display_name, plan_tier").ilike("display_name", "%Ana Exemplo%").maybeSingle();
if (!ana) { console.error("Dra. Ana demo não encontrada"); process.exit(1); }

// 2) coloca como Presença
await s.from("psychologists").update({ plan_tier: "presenca" }).eq("id", ana.id);
console.log("✓ Dra. Ana -> plano Presença");

// 3) gera ciclo do mês atual (8 peças) se ainda não houver
const d = new Date();
const cycle = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const { count } = await s.from("content_items").select("id", { count: "exact", head: true }).eq("psychologist_id", ana.id).eq("cycle", cycle);
if ((count ?? 0) === 0) {
  const rows = Array.from({length:8}, (_,i)=>({ psychologist_id: ana.id, cycle, title: `Peça ${i+1}`, format: "post", status: i<2?"producao":(i<3?"revisao":"briefing"), position: i }));
  const { error } = await s.from("content_items").insert(rows);
  if (error) { console.error("erro ao inserir ciclo:", error.message); process.exit(1); }
  console.log(`✓ ciclo ${cycle} criado (8 peças)`);
} else {
  console.log(`ciclo ${cycle} já tinha ${count} peças`);
}

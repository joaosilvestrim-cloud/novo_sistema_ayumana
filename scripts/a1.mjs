import { createClient } from "@supabase/supabase-js";
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data: pagos } = await s.from("psychologists").select("display_name,plan_tier,verification_status,is_published,crp_number").neq("plan_tier","essencial");
console.log("PLANOS PAGOS:");
(pagos??[]).forEach(y=>console.log(`- ${y.display_name} | ${y.plan_tier} | verif=${y.verification_status} | pub=${y.is_published} | crp=${y.crp_number}`));
const { data: pend } = await s.from("forum_questions").select("title").eq("status","pendente");
console.log(`\nFORUM PENDENTES = ${pend?.length ?? 0}`);
(pend??[]).forEach(q=>console.log(`  · ${q.title}`));
